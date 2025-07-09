import { replicateWebRTC, getConnectionHandlerSimplePeer } from 'rxdb/plugins/replication-webrtc';
import type { ProductCollection } from './schemas/product.ts';
import type { StoreId } from './initDB.ts';

export interface WebRTCConnectionOptions {
    iceServers?: RTCIceServer[];
    connectionTimeout?: number;
    maxRetries?: number;
}

export class WebRTCManager {
    private storeId: StoreId;
    private localCollection: ProductCollection | null = null;
    private remoteCollection: ProductCollection | null = null;
    private replicationState: any = null;
    private connectionOptions: WebRTCConnectionOptions;
    private isConnected: boolean = false;
    private connectionAttempts: number = 0;
    private maxRetries: number = 3;

    constructor(storeId: StoreId, options: WebRTCConnectionOptions = {}) {
        this.storeId = storeId;
        this.connectionOptions = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                ...(options.iceServers || [])
            ],
            connectionTimeout: options.connectionTimeout || 30000,
            maxRetries: options.maxRetries || 3
        };
        this.maxRetries = this.connectionOptions.maxRetries!;
    }

    async connect(localCollection: ProductCollection, remoteCollection: ProductCollection): Promise<void> {
        this.localCollection = localCollection;
        this.remoteCollection = remoteCollection;

        try {
            await this.establishConnection();
        } catch (error) {
            console.error('Failed to establish WebRTC connection:', error);

            if (this.connectionAttempts < this.maxRetries) {
                this.connectionAttempts++;
                console.log(`Retrying connection... Attempt ${this.connectionAttempts}/${this.maxRetries}`);

                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 2000 * this.connectionAttempts));
                return this.connect(localCollection, remoteCollection);
            }

            throw new Error(`Failed to establish WebRTC connection after ${this.maxRetries} attempts`);
        }
    }

    private async establishConnection(): Promise<void> {
        if (this.replicationState) {
            await this.replicationState.cancel();
        }

        const otherStoreId = this.storeId === 'store1' ? 'store2' : 'store1';

        try {
            // Setup WebRTC replication
            this.replicationState = replicateWebRTC({
                collection: this.localCollection!,
                topic: `bikepos-${this.storeId}-${otherStoreId}`,
                connectionHandlerCreator: getConnectionHandlerSimplePeer({
                    signalingServerUrl: 'wss://signaling.rxdb.info/',
                    iceServers: this.connectionOptions.iceServers,
                }),
                pull: {
                    batchSize: 10,
                    modifier: (doc: any) => {
                        // Only sync products that belong to the other store
                        // You can add filtering logic here if needed
                        return doc;
                    }
                },
                push: {
                    batchSize: 10,
                    modifier: (doc: any) => {
                        // Only push products that belong to this store
                        return doc;
                    }
                }
            });

            // Handle connection events
            this.replicationState.connected$.subscribe((connected: boolean) => {
                this.isConnected = connected;
                if (connected) {
                    console.log(`WebRTC connection established between ${this.storeId} and ${otherStoreId}`);
                    this.connectionAttempts = 0;
                } else {
                    console.log(`WebRTC connection lost between ${this.storeId} and ${otherStoreId}`);
                }
            });

            this.replicationState.error$.subscribe((error: any) => {
                console.error('WebRTC replication error:', error);
                this.isConnected = false;
            });

            // Setup bidirectional sync for remote view
            if (this.remoteCollection) {
                this.setupRemoteSync();
            }

            // Wait for initial connection
            await this.waitForConnection();

        } catch (error) {
            console.error('Error in establishConnection:', error);
            throw error;
        }
    }

    private createConnectionHandler(): any {
        return {
            create: async (topic: string, otherPeerId: string) => {
                console.log(`Creating WebRTC connection for topic: ${topic}, peer: ${otherPeerId}`);

                const peerConnection = new RTCPeerConnection({
                    iceServers: this.connectionOptions.iceServers
                });

                const dataChannel = peerConnection.createDataChannel('rxdb-replication', {
                    ordered: true
                });

                // Handle data channel events
                dataChannel.onopen = () => {
                    console.log('WebRTC data channel opened');
                };

                dataChannel.onclose = () => {
                    console.log('WebRTC data channel closed');
                };

                dataChannel.onerror = (error) => {
                    console.error('WebRTC data channel error:', error);
                };

                // Handle peer connection events
                peerConnection.oniceconnectionstatechange = () => {
                    console.log('ICE connection state:', peerConnection.iceConnectionState);

                    if (peerConnection.iceConnectionState === 'failed') {
                        console.log('ICE connection failed, restarting...');
                        peerConnection.restartIce();
                    }
                };

                peerConnection.onconnectionstatechange = () => {
                    console.log('Peer connection state:', peerConnection.connectionState);
                };

                return {
                    send: (data: any) => {
                        if (dataChannel.readyState === 'open') {
                            dataChannel.send(JSON.stringify(data));
                        }
                    },
                    close: () => {
                        dataChannel.close();
                        peerConnection.close();
                    },
                    onMessage: (handler: (data: any) => void) => {
                        dataChannel.onmessage = (event) => {
                            try {
                                const data = JSON.parse(event.data);
                                handler(data);
                            } catch (error) {
                                console.error('Error parsing WebRTC message:', error);
                            }
                        };
                    }
                };
            }
        };
    }

    private async setupRemoteSync(): Promise<void> {
        if (!this.remoteCollection) return;

        // Setup one-way sync from local to remote view
        // This ensures the remote view database stays updated
        this.localCollection?.$.subscribe(async (changeEvent) => {
            if (changeEvent.operation === 'INSERT' || changeEvent.operation === 'UPDATE') {
                try {
                    const doc = changeEvent.documentData;
                    await this.updateRemoteView(doc);
                } catch (error) {
                    console.error('Error updating remote view:', error);
                }
            } else if (changeEvent.operation === 'DELETE') {
                try {
                    await this.removeFromRemoteView(changeEvent.documentId);
                } catch (error) {
                    console.error('Error removing from remote view:', error);
                }
            }
        });
    }

    private async updateRemoteView(doc: any): Promise<void> {
        if (!this.remoteCollection) return;

        try {
            const existingDoc = await this.remoteCollection.findOne(doc.id).exec();

            if (existingDoc) {
                await existingDoc.update({
                    $set: doc
                });
            } else {
                await this.remoteCollection.insert(doc);
            }
        } catch (error) {
            console.error('Error updating remote view document:', error);
        }
    }

    private async removeFromRemoteView(docId: string): Promise<void> {
        if (!this.remoteCollection) return;

        try {
            const doc = await this.remoteCollection.findOne(docId).exec();
            if (doc) {
                await doc.remove();
            }
        } catch (error) {
            console.error('Error removing from remote view:', error);
        }
    }

    private async waitForConnection(): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('WebRTC connection timeout'));
            }, this.connectionOptions.connectionTimeout);

            const subscription = this.replicationState?.connected$.subscribe((connected: boolean) => {
                if (connected) {
                    clearTimeout(timeout);
                    subscription?.unsubscribe();
                    resolve();
                }
            });
        });
    }

    async disconnect(): Promise<void> {
        if (this.replicationState) {
            await this.replicationState.cancel();
            this.replicationState = null;
        }

        this.isConnected = false;
        this.connectionAttempts = 0;
        console.log(`WebRTC connection disconnected for ${this.storeId}`);
    }

    getConnectionStatus(): boolean {
        return this.isConnected;
    }

    async reconnect(): Promise<void> {
        if (this.localCollection && this.remoteCollection) {
            await this.disconnect();
            await this.connect(this.localCollection, this.remoteCollection);
        }
    }
}