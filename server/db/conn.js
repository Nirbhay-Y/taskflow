const mongoose=require("mongoose");

mongoose.connect(process.env.DATABASE)
.then(()=>{
    console.log("Happy to connect")
})
.catch(()=>{
    console.log("Error");
})