require("dotenv").config()

const app = require('./src/app')
const connectDB = require('./src/config/db')
 
// Connect to the database
connectDB()

app.listen(process.env.PORT || 3069, () => {
  console.log(`App is running on port ${process.env.PORT || 3069}`)
})