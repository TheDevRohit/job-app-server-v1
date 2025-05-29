const mongoose = require('mongoose');

const bannerSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    link: {
        type: String,
    },

    isClick : {
        type : Boolean,
        default: false
    },
    status: {
        type: Boolean,
        default: true
    },

})

module.exports = mongoose.model('Banner', bannerSchema);