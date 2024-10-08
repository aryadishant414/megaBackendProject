import mongoose , {Schema} from 'mongoose';

import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';


const videoSchema = new Schema(
    {
        videoFile: {
            type: String , //cloudinary url
            required: true,
        },
        thumbnail: {
            type: String , // cloudinary url
            required: true
        },
        title: {
            type: String , 
            required: true,
        },
        description: {
            type: String ,
            required: true,
        },
        duration: {
            type: Number ,
            required: true,
        },
        views: {
            type: Number,
            default: 0,   
        },
        isPublished: { // it says ki video publicaly available hai ya nahi
            type: Boolean,
            default: true, // it means ki agr video published ho hee gaya hai too dekhne dona sabko

        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    } , 
    {
        timestamps:true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)  // isse hamne limit laga di hai ki ekk time mai itne hee videos show hone chahiye user ko



export const Video = mongoose.model("Video" , videoSchema)

