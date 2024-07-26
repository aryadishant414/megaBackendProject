import mongoose , {Schema} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';  // Its a plugin for mongoose. We use this kyoki hame pata hai bohot saari lambi list hogi (jese bohot saare comments honge yaa fiir bohot saare videos honge) too hamm ekk saath mai too sabb user ko show nhi krwa skte hai na. Too ye plugin help krta hai at a time limited items hee show krega. Suppose in this model hamm comments ki baat krr rhe hai too iss PLugin ka use krke hamm limit laga denge ki itne hee comments show honge chhaiye iss type mai kuch 


const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    }, 
    {
        timestamps:true
    }
)


commentSchema.plugin(mongooseAggregatePaginate) 

export const Comment = mongoose.model("Comment" , commentSchema)