import multer from "multer";


// niche wala code is used to temporary store the data(submit by the user) on our local server
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({
     storage: storage 
})

// cb : callback function defined internally in node.js 