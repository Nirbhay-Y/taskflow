const mongoose=require("mongoose");
const bcrypt=require("bcrypt")
const validator=require("validator");
const jwt=require("jsonwebtoken");

const taskSchema = new mongoose.Schema({
    description: {
      type: String,
      required: true,
    },
    title:{
        type: String, // e.g., 'Meeting with client'
        required: true,
    },
    customDate: {
      type: String, // e.g., '2025-05-07'
      required: true,
    },
    customTime: {
      type: String, // e.g., '14:30'
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });
  
  

const UserSchema=new mongoose.Schema({
    Name:{
        type:String,
        required:true
    },
    Email:{
        type:String,
        required:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Invalid Email");
            }
        }
    },
    Phone:{
        type:Number,
        required:true
    },
    Password:{
        type:String,
        required:true
    },
    tokens:[
        {
            token:{
            type:String,
            required:true
            }
        }
    ],
    tasks: [taskSchema]
})

UserSchema.pre('save',async function (next) { // middleware
    if(this.isModified("Password")){
        this.Password=await bcrypt.hash(this.Password,12);
    }
    next();
})

UserSchema.methods.generateAuthToken=async function () {
    try {
        const tokennir=jwt.sign({_id:this._id},process.env.SECRET_KEY);
        this.tokens=this.tokens.concat({token:tokennir});
        await this.save();
        return tokennir;
    } catch (error) {
        res.send("Error");
    }
}

const User = mongoose.model('User', UserSchema);
module.exports=User;