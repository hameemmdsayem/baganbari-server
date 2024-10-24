const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: ['http://localhost:5173'],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'DELETE, PUT, GET, POST')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  )
  next()
})


app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.kuzl5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    //codes will be here

    // creating collections

    const plantCollection = client.db("baganbari").collection("plants");
    const userCollection = client.db('baganbari').collection('users');
    const shopCollection = client.db('baganbari').collections('shops');

    // get user Informations
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.status(200).json({ message: 'User already exists', exists: true });
      }
      const result = await userCollection.insertOne(user);
      res.status(201).json(result);
    })

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result)
    })


    //get all plants data
    app.get('/allplants', async (req, res) => {
      const result = await plantCollection.find().toArray();
      res.send(result);
    })


    //get flowers
    app.get('/allplants/flowers', async (req, res) => {
      const result = await plantCollection.find({ category: "Flower" }).toArray();

      res.send(result);
    })

    //get fruits
    app.get('/allplants/fruits', async (req, res) => {
      const result = await plantCollection.find({ category: "Fruit" }).toArray();

      res.send(result);
    })

    // get plants by shop name
    // app.get('/allplants/shop-products', async(req, res)=>{
    //   const result = 
    // })


    //get plants by id
    app.get('/allplants/:id', async (req, res) => {
      const id = req.params.id;

      // Check if the ID is a valid ObjectId
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format. It must be a 24-character hex string.' });
      }

      const query = { _id: new ObjectId(id) };

      try {
        const result = await plantCollection.findOne(query);
        if (result) {
          res.send(result);
        } else {
          res.status(404).json({ error: 'Plant not found' });
        }
      } catch (error) {
        console.error('Error fetching plant by ID:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });





    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send("Baganbari Server is running")
})

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
})