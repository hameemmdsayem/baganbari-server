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
    const shopCollection = client.db('baganbari').collection('shops');

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
    app.get('/shops', async (req, res) => {
      const result = await shopCollection.find().toArray();
      res.send(result);
    })

    app.patch("/shops/restrict/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const updatedStatus = {
        $set: {
          status: "restrict",
        }
      }
      const result = await shopCollection.updateOne(filter, updatedStatus);
      res.send(result);
    })
    app.patch("/shops/active/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const updatedStatus = {
        $set: {
          status: "active",
        }
      }

      const result = await shopCollection.updateOne(filter, updatedStatus);
      res.send(result);
    })

    // Search plants by name or keyword
    app.get('/plants', async (req, res) => {
      const { name } = req.query; // Get the name from the query parameters
      if (!name) {
        return res.status(400).json({ error: 'No search keyword provided.' }); // Handle missing keyword
      }

      try {
        // Find plants matching the keyword, case insensitive
        const plants = await plantCollection.find({ name: { $regex: name, $options: 'i' } }).toArray();
        res.json(plants); // Return the matching plants
      } catch (error) {
        console.error('Error searching plants:', error);
        res.status(500).json({ error: 'Internal server error' }); // Send JSON error response
      }
    });





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

    //get shops by id
    app.get('/shops/:id', async (req, res) => {
      const id = req.params.id;

      // Check if the ID is a valid ObjectId
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format. It must be a 24-character hex string.' });
      }

      const query = { _id: new ObjectId(id) };

      try {
        const result = await shopCollection.findOne(query);
        if (result) {
          res.send(result);
        } else {
          res.status(404).json({ error: 'Shop not found' });
        }
      } catch (error) {
        console.error('Error fetching shop by ID:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });


    // Get plants by shopName
    app.get('/allplants/shopName/:name', async (req, res) => {
      const shopName = req.params.name;  // Correct parameter name

      const query = { shopName: shopName };  // Match documents by shopName

      try {
        const result = await plantCollection.find(query).toArray();  // No options needed for find
        if (result && result.length > 0) {  // Check if results were found
          res.send(result);
        } else {
          res.status(404).json({ error: 'Shop not found' });
        }
      } catch (error) {
        console.error('Error fetching plants by shop name:', error);
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