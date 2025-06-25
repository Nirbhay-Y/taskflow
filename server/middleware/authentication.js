const jwt =require("jsonwebtoken");
const User=require("../model/Useschema");

const authentication=async(req,res,next)=>{
  try {
    const token = req.headers.authorization.split(" ")[1];
    const verifyToken=jwt.verify(token,process.env.SECRET_KEY);

    const rootuser=await User.findOne({_id:verifyToken._id,"tokens.token":token});
    if(!rootuser){
        throw new Error("User not found"); 
    }

    req.user=rootuser;
    req.token = token;

    next();
    
  } catch (error) {
    res.status(401).send('Unauthorized: No token provided');
        
  }
}

module.exports=authentication;