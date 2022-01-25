let validate = require('./validator')
let productModel = require('../models/productModel')
let userModel = require('../models/userModel')
let awsCon = require('./awsController')

let releaseProduct = async function (req, res) {

    try {
        const reqBody = req.body
        let files = req.files

        if (!validate.isValidRequestBody(reqBody)) {
            res.status(400).send({ status: false, message: "request body is required" })
            return
        }

        let { title, description, price, currencyId, currencyFormat, productImage, installments, style, availableSizes } = reqBody

        // let availSiz = JSON.parse(availableSizes)
        // console.log(typeof availableSizes)
        if (!validate.isValid(title)) {
            res.status(400).send({ status: false, message: "enter valid title" })
            return
        }

        if (!validate.isValid(description)) {
            res.status(400).send({ status: false, message: "enter valid description" })
            return
        }

        if (!validate.isValid(price)) {
            res.status(400).send({ status: false, message: "price is required" })
            return
        }

        // function roundN(num,n){
        //     return parseFloat(Math.round(num * Math.pow(10, n)) /Math.pow(10,n)).toFixed(n);
        // }

        // if(price){
        //     roundN(price, 4)
        // }

        if (!validate.isValid(currencyId)) {
            res.status(400).send({ status: false, message: "currencyId is required" })
            return
        }

        if (!validate.isValid(currencyFormat)) {
            res.status(400).send({ status: false, message: "currencyFormat is required" })
            return
        }

        if (!validate.isValid(availableSizes)) {
            res.status(400).send({ status: false, message: `size is required` })
            return
        }

        for (let i = 0; i < availableSizes.length; i++) {
            if (!validate.isValid(availableSizes[i])) {
                res.status(400).send({ status: false, message: `${availableSizes[i]} is not valid size` })
                return
            }
        }

        console.log(typeof availableSizes)
        for (let i = 0; i < availableSizes.length; i++) {
            if (!validate.isValidSize(availableSizes[i])) {
                res.status(400).send({ status: false, message: `${availableSizes[i]} not a valid size please enter size Btween 'S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'` })
                return
            }
        }

        let findTitle = await productModel.findOne({ title })
        if (findTitle) {
            res.status(403).send({ status: false, message: "product with this title already exist it must be unique" })
            return
        }

        if (files && files.length > 0) {
            let uploadedFileURL = await awsCon.uploadFile(files[0])

            let saveProductData = {
                title,
                description,
                price,
                currencyId,
                currencyFormat,
                availableSizes,
                productImage: uploadedFileURL,
                installments,
                style
            }
            console.log(price)

            let createProduct = await productModel.create(saveProductData)
            res.status(200).send({ status: true, message: `product ${title} created successfully`, data: createProduct })
            return
        } else {
            res.status(400).send({ status: false, message: "product image is required" })
            return
        }
    } catch (error) {
        res.status(500).send({ seatus: false, message: error.message })
    }
}

// get product by query localhost:3000/products
const getProduct = async function (req, res) {
    try {

        if (req.query.size || req.query.name || req.query.priceGreaterThan || req.query.priceLessThan) {
            let availableSizes = req.query.size
            let title = req.query.name
            let priceGreaterThan = req.query.priceGreaterThan
            let priceLessThan = req.query.priceLessThan
            obj = {}
            if (availableSizes) {
                obj.availableSizes = availableSizes.toUpperCase()
            }
            if (title) {
                obj.title = { $regex: '.*' + title.toLowerCase() + '.*' }
            }
            if (priceGreaterThan) {
                obj.price = { $gt: priceGreaterThan }
            }
            if (priceLessThan) {
                obj.price = { $lt: priceLessThan }
            }

            if (priceGreaterThan && priceLessThan) {
                obj.price = { $gt: priceGreaterThan, $lt: priceLessThan }
            }
            obj.isDeleted = false
            obj.deletedAt = null

            console.log(obj)
            const getProductsList = await productModel.find(obj).sort({ price: 1 })
            // console.log(getProductsList)
            if (!getProductsList || getProductsList.length == 0) {
                res.status(400).send({ status: false, message: `product is not available right now.` })
            } else {
                res.status(200).send({ status: true, message: 'Success', data: getProductsList })
            }
        } else {
            const getListOfProducts = await productModel.find({ isDeleted: false, deletedAt: null }).sort({ price: 1 })
            res.status(200).send({ status: true, message: 'Success', data: getListOfProducts })
        }
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }

}

//get product Delails by id localhost:3000/products/:productId
const getProductById = async function (req, res) {
    try {
        let id = req.params.productId

        if (!validate.isValidObjectId(id)) {
            res
                .status(404)
                .send({ status: false, message: `${id} is not valid user id ` });
            return;
        }

        let findPro = await productModel.findOne({ _id: id, isDeleted: false })
        if (!findPro) {
            res.status(404).send({ status: false, message: `product is not available with this ${id} id` })
            return
        }

        let data = await productModel.find({ _id: id, isDeleted: false, deletedAt: null })
        // if (!data) {
        //     res.status(400).send({ status: false, message: "Product is not present with this ID. Please provide valid ID!!" })
        // }
        res.status(200).send({ status: true, message: "Success", data: data })
    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

//update product by id  localhost:3000/products/:productId
const updateProduct = async function (req, res) {
    try {

        let productId = req.params.productId;
        const requestBody = req.body;
        const files = req.files

        if (!validate.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: 'enter valid product ID' })
        }

        let productDetails = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!productDetails) {
            return res.status(404).send({ status: false, message: `productDetails not found with given productID` })
        }

        const { title, description, price, isFreeShipping, currencyId, currencyFormat, style, availableSizes, installments, productImage } = requestBody
        
        const istitleAlreadyUsed = await productModel.findOne({ _id: productId });
        
        if (Object.prototype.hasOwnProperty.call(requestBody, "title")) {
            if (!validate.isValid(title)) {
                res.status(400).send({ status: false, message: "please enter valid title" })
                return
            }
            const istitleAlreadyUsed = await productModel.findOne({ title });
            
            if (istitleAlreadyUsed) {
                res.status(400).send({ status: false, message: `${title} these title is already registered` })
                return
            }

        }

        if (Object.prototype.hasOwnProperty.call(requestBody, "description")) {
            if (!validate.isValid(description)) {
                res.status(400).send({ status: false, message: "please enter valid description" })
                return
            }
        }
        //isFreeShipping
        if (Object.prototype.hasOwnProperty.call(requestBody, "price")) {
            if (!validate.isValid(price)) {
                res.status(400).send({ status: false, message: "please enter valid price" })
                return
            }
        }

        if (Object.prototype.hasOwnProperty.call(requestBody, "isFreeShipping")) {
            if (!validate.isValid(isFreeShipping)) {
                res.status(400).send({ status: false, message: "please enter valid isFreeShipping" })
                return
            }
        }

        if (Object.prototype.hasOwnProperty.call(requestBody, "currencyId")) {
            if (!validate.isValid(currencyId)) {
                res.status(400).send({ status: false, message: "please enter valid currencyId" })
                return
            }
        }//currencyFormat

        if (Object.prototype.hasOwnProperty.call(requestBody, "currencyFormat")) {
            if (!validate.isValid(currencyFormat)) {
                res.status(400).send({ status: false, message: "please enter valid currencyFormat" })
                return
            }
        }

        if (Object.prototype.hasOwnProperty.call(requestBody, "style")) {
            if (!validate.isValid(style)) {
                res.status(400).send({ status: false, message: "please enter valid style" })
                return
            }
        }

        if (Object.prototype.hasOwnProperty.call(requestBody, "availableSizes")) {

            for(let i = 0; i < availableSizes.length; i++ ){
            if (!validate.isValid(availableSizes[i])) {
                res.status(400).send({ status: false, message: "please enter valid availableSizes" })
                return
            }
            
            if(!validate.isValidSize(availableSizes[i])){
                res.status(400).send({status: false, message: `${availableSizes[i]} not a valid size please enter size Btween 'S', 'XS', 'M', 'X', 'L', 'XXL', 'XL' `})
                return
            }

            if(istitleAlreadyUsed.availableSizes.indexOf(availableSizes) !== -1){
                res.status(400).send({status: false, message: "this size already avalible"})
                return
            }
            console.log(istitleAlreadyUsed.availableSizes.indexOf(availableSizes))
        }
    }
    
    if (Object.prototype.hasOwnProperty.call(requestBody, "installments")) {
        if(!validate.isValid(installments)){
                res.status(400).send({ status: false, message: "please enter valid installments" })
                return
            }
        }     //productImage

        // if (Object.prototype.hasOwnProperty.call(req.files.productImage)) {
        if (files && files.length > 0) {
            var uploadedFileURL = await awsCon.uploadFile(files[0]);
            console.log(uploadedFileURL)
            // requestBody.productImage = uploadedFileURL
        }
        // if(!validate.isValid(productImage)){
        //     res.status(400).send({status: false, message: " please add valid product image"})
        //     return
        // }
    // }
    
    console.log(req.files)
    // console.log(uploadedFileURL)

        if (!validate.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: 'No paramateres passed. product unmodified' })
        }

        const productValue = { 
            title, 
            description, 
            price, 
            isFreeShipping, 
            currencyId, 
            currencyFormat, 
            productImage: uploadedFileURL, 
            style, 
            installments 
        }

        await productModel.findOneAndUpdate({_id: productId}, {$push: {availableSizes: availableSizes}})
        const upatedProduct = await productModel.findOneAndUpdate({ _id: productId }, productValue, { new: true })
        res.status(200).send({ status: true, message: 'User updated successfully', data: upatedProduct });


    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

//delete product by Id
const deleteproductByID = async (req, res) => {
    try {

        const params = req.params.productId;

        if (!validate.isValidObjectId(params)) {
            return res.status(400).send({ status: false, message: "Inavlid productID." })
        }

        const findproduct = await productModel.findById({ _id: params })

        if (!findproduct) {

            return res.status(404).send({ status: false, message: `No product found ` })

        }

        else if (findproduct.isDeleted == true) {
            return res.status(400).send({ status: false, message: `product has been already deleted.` })
        } else {
            const deleteData = await productModel.findOneAndUpdate({ _id: { $in: findproduct } }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true });
            return res.status(200).send({ status: true, message: "product deleted successfullly."})
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: "Something went wrong", Error: err.message })
    }
}

module.exports = { releaseProduct, getProduct, getProductById, updateProduct, deleteproductByID }
