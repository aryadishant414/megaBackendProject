import mongoose , {Schema} from 'mongoose'

import jwt from 'jsonwebtoken'

import bcrypt from 'bcrypt'

const userSchema = new Schema({
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,  // heavy operation hai so jaha need hai vhi lagana
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String,  // cloudinary url
            required: true,
        },
        coverImage: {
            type: String,  // cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {  // yeh password ko ham encrypt krwaenge kyoki w.k ki password ko normal string mai ham database mai send krenge tab too koi bhi hamari ko access krlega
            type : String,
            required: [true , 'Password is required']  // agr true nhi hua too ye string show hogi
        },
        refreshToken: {
            type: String
        }

    } , 
    {
        timestamps: true
    }
)


// Iss niche wale sai hamara password encrypt hogya hai
userSchema.pre("save" , async function (next) {

    if(!this.isModified("password")) return next();

     this.password = await bcrypt.hash(this.password , 10)
    next()
})


// Niche wala true/false bhejege ki jo user ne password dala hai wo and database mai jo password pada hai wo equal hai ya nhi
userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password , this.password)
}


// Access Token Generate krr rha hai ye niche wala
userSchema.methods.generateAccessToken = function(password){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
 }


 // Refresh Token Generate krr rha hai ye niche wala
 userSchema.methods.generateRefreshToken = function(password){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
 }

//  NOTE : `_id` : iss name sai hee id ka variable MongoDb ke andar store pada hota hai
 
 


export const User = mongoose.model("User" , userSchema)