import * as crypto from 'crypto';

class Transaction {
    constructor(quantity: number, senderPublicKey: string, recipientPublicKey: string) {

    }

    toString() {
        return JSON.stringify(this);
    }
}

class Block {

    public nonce = Math.round(Math.random() * 999999999);

    constructor(public prevHash: string, public transaction: Transaction, public timestamp = Date.now()) { }

    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}

class Chain {

    public static instance = new Chain();
    chain: Block[];

    constructor() {
        this.chain = [new Block('', new Transaction(100, 'genesis', 'joel'))] // add the genesis block to the chain
    }

    // Proof of work system
    mine(nonce: number) {
        let solution = 1;
        console.log('mining...')

        while (true) {

            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');

            if (attempt.substr(0, 4) === '0000') {
                console.log(`Solved: ${solution}`);
                return solution;
            }

            solution += 1;
        }
    }

    // Add a new block to the chain if valid signature & proof of work is complete
    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
        const verify = crypto.createVerify('SHA256');
        verify.update(transaction.toString());

        const isValid = verify.verify(senderPublicKey, signature);

        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }

    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    // // enforce singleton
    // public static get Instance() {
    //     return this.instance ? this.instance : (this.instance = new this());
    // }
}

class Wallet {
    public publicKey: string;
    private privateKey: string;
    public balance: number;

    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });

        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
        this.balance = 100;
    }

    sendTo(recipientPublicKey: string, quantity: number) { // TODO: add funds to recipient's wallet
        if (quantity > this.balance) {
            console.log("Error: Insufficiant funds in sender's wallet")
        }
        else {
            this.balance -= quantity;
            const transaction = new Transaction(quantity, this.publicKey, recipientPublicKey);

            const sign = crypto.createSign('SHA256');
            sign.update(transaction.toString()).end();

            const signature = sign.sign(this.privateKey);
            Chain.instance.addBlock(transaction, this.publicKey, signature);
        }
    }
}

const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();

satoshi.sendTo(bob.publicKey, 50);
bob.sendTo(alice.publicKey, 23);
alice.sendTo(bob.publicKey, 5);

console.log(Chain.instance)