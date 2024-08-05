import multer from "multer";


// niche wala code is used to temporary store the data(submit by the user) on our local server
// console.log("multer file ke andar aagye hai ham");

const storage = multer.diskStorage({
    
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
      console.log("MULTER ki desstination ke andar hai ham");
      
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
      console.log("MULTER ki filename ke andar hai ham");

    }
  })
  
export const upload = multer({
     storage: storage 
})

// cb : callback function defined internally in node.js 