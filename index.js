const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
//middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g42knj4.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

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

        app.post('/orders', async (req, res) => {
            const order = req.body
            console.log(order);
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        })

        app.post('/users', async (req, res) => {
            const user = req.body
            console.log(user);
            const result = await usersCollection.insertOne(user);
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