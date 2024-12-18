const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://baganbari-bb64e.firebaseapp.com',
    'https://baganbari-bb64e.web.app'
  ],
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
    const cartCollection = client.db('baganbari').collection('carts');
    const checkoutCollection = client.db('baganbari').collection('checkouts');




    // get admin
    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const allUser = await userCollection.findOne(query)
      let admin = false;
      if (allUser) {
        admin = allUser?.role === 'admin'
      }
      res.send({ admin })
    })

    // get Owner
    app.get('/users/owner/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const allUser = await userCollection.findOne(query)
      let owner = false;
      if (allUser) {
        owner = allUser?.role === 'owner'
      }
      res.send({ owner })
    })


    //get User
    app.get('/users/user/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const allUser = await userCollection.findOne(query)
      let user = false;
      if (allUser) {
        user = allUser?.role === 'user'
      }
      res.send({ user })
    })



    // get user Informations
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })


    app.get('/users/owner', async (req, res) => {
      const result = await userCollection.find({role: 'owner'}).toArray();
      res.send(result);
    })

    app.patch('/users/role/owner/:email', async (req, res) => {
      const getEmail = req.params.email;
      const filter = { email: getEmail };
      const updateRole = {
        $set: {
          role: "owner"
        }
      }
      const result = await userCollection.updateOne(filter, updateRole)
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

    //get User by email
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const result = await userCollection.findOne(query)

      res.send(result)
    })

    app.patch("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };

      const { name, profilePicture } = req.body;

      const updatedInfo = {
        $set: {
          name: name,
          profilePicture: profilePicture
        }
      };

      try {
        const result = await userCollection.updateOne(query, updatedInfo);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update user" });
      }
    });



    //get all plants data
    app.get('/allplants', async (req, res) => {
      const result = await plantCollection.find().toArray();
      res.send(result);
    })

    //get all plants data
    app.post('/allplants', async (req, res) => {
      const plants = req.body
      const result = await plantCollection.insertOne(plants);
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

    // get shops
    app.get('/shops', async (req, res) => {
      const result = await shopCollection.find().toArray();
      res.send(result);
    })

    app.post("/shops", async (req, res) => {
      const shops = req.body;

      const result = await shopCollection.insertOne(shops);
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



    app.delete('/allplants/:id', async (req, res) => {
      const id = req.params.id;

      // Validate ID format
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format. It must be a 24-character hex string.' });
      }

      const query = { _id: new ObjectId(id) };

      try {
        const result = await plantCollection.deleteOne(query);
        if (result.deletedCount === 1) {  // Check if a document was deleted
          res.json({ message: 'Plant deleted successfully.' });
        } else {
          res.status(404).json({ error: 'Plant not found' });
        }
      } catch (error) {
        console.error('Error deleting plant by ID:', error);
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




    app.patch('/allplants/:id', async (req, res) => {
      const id = req.params.id;

      // Validate ID format
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format. It must be a 24-character hex string.' });
      }

      const { name, image, description, price, careInstructions, category } = req.body;

      // Define the fields to update
      const updatedInfo = {
        $set: {
          name,
          image,
          description,
          price,
          careInstructions,
          category,
        }
      };

      const query = { _id: new ObjectId(id) };

      try {
        const result = await plantCollection.updateOne(query, updatedInfo);
        if (result.modifiedCount === 1) {  // Check if a document was modified
          res.json({ message: 'Plant information updated successfully.' });
        } else {
          res.status(404).json({ error: 'Plant not found or no changes were made' });
        }
      } catch (error) {
        console.error('Error updating plant information:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });



    // Get shop by creatorName
    app.get('/shops/creatorName/:name', async (req, res) => {
      const creatorName = req.params.name;  // Correct parameter name
      const query = { creatorName: creatorName };  // Match documents by creatorName

      try {
        const result = await shopCollection.findOne(query);  // Retrieve one document
        if (result) {  // Check if a document was found
          res.send(result);
        } else {
          res.status(404).json({ error: 'Shop not found' });
        }
      } catch (error) {
        console.error('Error fetching shop by creator name:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });







    // add to cart

    app.get('/carts/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    })


    app.post('/carts', async (req, res) => {
      const products = req.body;

      const result = await cartCollection.insertOne(products);
      res.send(result);
    })


    // app.post('/checkouts', async (req, res) => {
    //   const products = req.body;

    //   const result = await checkoutCollection.insertMany(products);
    //   res.send(result);
    // })

    app.get('/checkouts', async (req, res) => {
      const result = await checkoutCollection.find().toArray();
      res.send(result);
    })

    app.get('/checkouts/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await checkoutCollection.find(query).toArray();
      res.send(result);
    })

    //   app.get('/checkouts/:shopName', async (req, res) => {
    //     const shopName = req.params.shopName; // Extract shopName from URL params

    //     const query = { shopName: shopName }; // Create query to filter by shopName

    //     try {
    //         const result = await checkoutCollection.find(query).toArray();
    //         if (result.length > 0) {
    //             res.send(result); // Send the found documents
    //         } else {
    //             res.status(404).send({ message: 'No data found for this shop' }); // No matching documents
    //         }
    //     } catch (error) {
    //         console.error('Error fetching checkout data:', error);
    //         res.status(500).send({ message: 'Internal server error' }); // Server error
    //     }
    // });



    // Copy all items from cartCollection to checkoutCollection and then delete them from the cart
    app.post('/checkouts', async (req, res) => {
      const { email, products, address, phone, totalPrice } = req.body;
    
      try {
        // Ensure that there are products in the request body
        if (!products || products.length === 0) {
          return res.status(400).send({ message: "No products to checkout." });
        }
    
        // Prepare the order data including the address, phone, and total price
        const orderData = {
          email: email,
          products: products,
          totalPrice: totalPrice,
          address: address,
          phone: phone,
          orderDate: new Date(),
        };
    
        // Insert the order data into the checkoutCollection
        const insertResult = await checkoutCollection.insertOne(orderData);
        
    
        // Now attempt to delete the cart items for this email
        // const deleteResult = await cartCollection.deleteMany({ email });
        // console.log("Delete result from carts collection:", deleteResult);
    
        // // If no documents were deleted, it may be due to a mismatch in email or no matching records
        // if (deleteResult.deletedCount === 0) {
        //   console.warn("No cart items were deleted, please check the email or cart data.");
        // }
    
        // Send the result of the insert and delete operations back to the client
        res.send({
          message: "Checkout successful",
          insertResult,
          // deleteResult,
        });
      } catch (error) {
        console.error("Error during checkout:", error);
        res.status(500).send({
          message: "Checkout failed",
          error: error.message,
        });
      }
    });
    
    
    


    app.delete('/carts/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await cartCollection.deleteMany(query);
      res.send(result);
    });

    app.delete('/carts/:email/:productId', async (req, res) => {
      const email = req.params.email;
      const productId = req.params.productId;

      // Query to match both email and product ID
      const query = { email: email, _id: new ObjectId(productId) };

      try {
        const result = await cartCollection.deleteOne(query);
        if (result.deletedCount === 1) {
          res.status(200).send({ message: "Product removed from cart successfully." });
        } else {
          res.status(404).send({ message: "Product not found in cart." });
        }
      } catch (error) {
        console.error("Error removing product from cart:", error);
        res.status(500).send({ message: "Error removing product from cart." });
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