let mongoose = require('mongoose')

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

const isValidTitle = function (title) {
    return ['Mr', 'Mrs', 'Miss'].indexOf(title) !== -1
}

const isValidSize = function (size) {
    return ["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(size) !== -1
    }

let isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length !== 0
}

let isValidPhone = function (str) {
    if (/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/.test(str)) {
        return true
    }
    return false
}

let isValidEmail = function (email) {
    if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.trim()))) {
        return true;
    }
}

module.exports = { isValidTitle, isValidRequestBody, isValid, isValidPhone, isValidObjectId, isValidEmail, isValidSize }


// if (/^(1\s|1|)?((\(\d{3}\))|\d{3})(\-|\s)?(\d{3})(\-|\s)?(\d{4})$/.test(str)) {
// if (/^(?:(?:\+|0{0,2})91(\s*[\ -]\s*)?|[0]?)?[6789]\d{9}|(\d[ -]?){10}\d$/.test(str)) {