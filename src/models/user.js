const mongoose = require('mongoose');

const userSchema=mongoose.Schema({
    name:{
        type:String
    },
    ci:{
        type:Number
    },
    url_img:{
        type:String
    }
});

module.exports=mongoose.model('user',userSchema);