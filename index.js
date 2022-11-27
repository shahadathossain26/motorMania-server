const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
//middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g42knj4.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    console.log('token inside verifyjwt', req.headers.authorization)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access')
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {

        const categoryCollection = client.db('motorMania').collection('category');
        const productsCollection = client.db('motorMania').collection('products');
        const ordersCollection = client.db('motorMania').collection('orders');
        const usersCollection = client.db('motorMania').collection('users');

        app.get('/categories', async (req, res) => {
            const query = {}
            const result = await categoryCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/category/:id', async (req, res) => {
            const id = req.params.id
            const query = { category_id: id }
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/orders', verifyJWT, async (req, res) => {
            const email = req.query.email
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email }
            const orders = await ordersCollection.find(query).toArray();
            res.send(orders);
        })

        app.post('/orders', async (req, res) => {
            const order = req.body
            console.log(order);
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === "admin" });
        })

        app.post('/users', async (req, res) => {
            const user = req.body
            const userQuery = { email: req.body.email }
            const storedUser = await usersCollection.findOne(userQuery);
            if (storedUser) {
                return
            }
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '2h' })
                return res.send({ accessToken: token })
            }
            console.log(user)
            res.status(403).send({ accessToken: '' })

        })

        app.get('/buyers', async (req, res) => {
            const filter = { account_type: "Buyer" }
            const result = await usersCollection.find(filter).toArray();
            res.send(result);
        })

        app.get('/sellers', async (req, res) => {
            const filter = { account_type: "Seller" }
            const result = await usersCollection.find(filter).toArray();
            res.send(result);
        })

        app.put('/users/verify/:id', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user?.role !== "admin") {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    status: 'verified'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
    }

    finally {

    }
}
run().catch(console.log)


app.get('/', async (req, res) => {
    res.send('Motor Mania server is running')
})
app.listen(port, () => console.log(`Motor Mania running on port ${port}`))