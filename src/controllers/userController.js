let userModel = require("../models/userModel");
let validate = require("./validator");
let bcryptjs = require("bcryptjs");
let jwt = require("jsonwebtoken");
let awsCon = require("./awsController");
const { varifyUser } = require("../middleware/verify");

//!register user - localhost:3000/register ----------------->
let registerUser = async function (req, res) {
    try {
        let reqBody = req.body;
        let files = req.files;

        if (!validate.isValidRequestBody(reqBody)) {
            res.status(400).send({ status: false, message: "no user Details found" });
            return;
        }

        console.log("abc")
        let { fname, lname, email, profileImage, phone, password, address } = reqBody;

        if (!validate.isValid(fname)) {
            res
                .status(400)
                .send({ status: false, message: "username field is not be empty" });
            return;
        }

        if (!validate.isValid(lname)) {
            res
                .status(400)
                .send({ status: false, message: "last name field is not be empty" });
            return;
        }

        if (!validate.isValid(email)) {
            res
                .status(400)
                .send({ status: false, message: "email field is not be empty" });
            return;
        }

        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.trim())) {
            res
                .status(400)
                .send({ status: false, message: `${email} is not a valid email` });
            return;
        }

        let findEmail = await userModel.findOne({ email });
        console.log("abc")

        if (findEmail) {
            res.status(400).send({
                status: false,
                message: `${email} is already registered please login`,
            });
            return;
        }

        //todo ---------------->

        if (!validate.isValid(phone)) {
            res
                .status(400)
                .send({ status: false, message: "phone field is not be empty" });
            return;
        }

        if (!validate.isValidPhone(phone)) {
            res
                .status(400)
                .send({ status: false, message: `${phone} is not a valid phone` });
            return;
        }

        let findPhone = await userModel.findOne({ phone });

        if (findPhone) {
            res.status(400).send({
                status: false,
                message: `${phone} is already registered please login`,
            });
            return;
        }

        if (!validate.isValid(password)) {
            res.status(400).send({ status: false, message: "password is mendatory" });
            return;
        }

        if (!(password.length >= 8) && password.length <= 15) {
            res
                .status(400)
                .send({ status: false, message: "password length must be 8 to 15" });
            return;
        }
        console.log("abc")

        if (!validate.isValid(address)) {
            res
                .status(400)
                .send({ status: false, message: "address field is required" });
            return;
        }

        if (!validate.isValid(address.shipping)) {
            res.status(400).send({
                status: false,
                msg: "Invalid request parameters. Please Provide valid shipping address!!",
            });
            return;
        }
        if (!validate.isValid(address.shipping.street)) {
            res.status(400).send({
                status: false,
                msg: "Invalid request parameters. Please Provide valid street in shipping address!!",
            });
            return;
        }
        if (!validate.isValid(address.shipping.city)) {
            res.status(400).send({
                status: false,
                msg: "Invalid request parameters. Please Provide valid city in shipping address!!",
            });
            return;
        }
        if (!validate.isValid(address.shipping.pincode)) {
            res.status(400).send({
                status: false,
                msg: "Invalid request parameters. Please Provide valid pincode in shipping address!!",
            });
            return;
        }
        if (!validate.isValid(address.billing)) {
            res.status(400).send({
                status: false,
                msg: "Invalid request parameters. Please Provide valid billing address!!",
            });
            return;
        }
        if (!validate.isValid(address.billing.street)) {
            res.status(400).send({
                status: false,
                msg: "Invalid request parameters. Please Provide valid street in billing address!!",
            });
            return;
        }
        console.log("abc2")
        if (!validate.isValid(address.billing.city)) {
            res.status(400).send({
                status: false,
                msg: "Invalid request parameters. Please Provide valid city in billing address!!",
            });
            return;
        }
        if (!validate.isValid(address.billing.pincode)) {
            res.status(400).send({
                status: false,
                msg: "Invalid request parameters. Please Provide valid pincode in billing address!!",
            });
        }
        //vaidation end
        console.log("abc3")

        if (files && files.length > 0) {
            //upload to s3 and return true..incase of error in uploading this will goto catch block( as rejected promise)
            let uploadedFileURL = await awsCon.uploadFile(files[0]); 
            // reqBody.profileImage = uploadedFileURL;
            //pasword encryption-------->

            // if (!validate.isValid(profileImage)) {
            //     res.status(400).send({ status: false, message: "profileImage is mendatory" })
            //     return
            // }
            let encryptPass = await bcryptjs.hash(password, 10);
            let saveData = {
                fname,
                lname,
                email,
                profileImage: uploadedFileURL,
                phone,
                password: password ? encryptPass : "password is required",
                address,
            };
            console.log("abc4")
            let createUser = await userModel.create(saveData);
            res.status(201).send({
                status: true,
                message: "user successfully registerd",
                data: createUser,
            });
        } else {
            res.status(400).send({ status: false, message: "please select profile image" })
        }
    } catch (error) {
        res.status(500).send({ status: false, message: error.message});
    }
};

//!get user details // localhost:3000/user/:userId/profile------------>
const getUser = async function (req, res) {
    try {
        let userId = req.params.userId;
        let userToken = req.userId;

        if (!validate.isValidObjectId(userId)) {
            res
                .status(404)
                .send({ status: false, message: `${userId} is not valid user id ` });
            return;
        }

        if (userToken !== userId) {
            res.status(400).send({ status: false, message: "authorization failed!" });
            return;
        }

        let getUser = await userModel.findOne({ _id: userId });
        if (!getUser) {
            return res
                .status(404)
                .send({ status: false, msg: "Provide valid UserId" });
        }
        res
            .status(200)
            .send({ status: true, message: "User profile details", data: getUser });
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
};

//!update user details  localhost:3000/user/:userId/profile----------->
const updateUserDetailes = async (req, res) => {
    try {
        let userId = req.params.userId;
        const requestBody = req.body;
        const profileImage = req.files
        let TokenDetail = req.userId

        if(!validate.isValidObjectId(userId)){
            res.status(400).send({status: false, message: "enter valid object Id"})
        }

        if (!validate.isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: "which filed do you want to update ?" })
            return
        }

        const UserFound = await userModel.findOne({ _id: userId })
        if (!UserFound) {
            return res.status(404).send({ status: false, message: `User not found with given UserId` })
        }

        if (!TokenDetail === userId) {
            res.status(400).send({ status: false, message: "userId in url param and in token is not same" })
        }

        let { fname, lname, email, phone, password } = requestBody

        if (Object.prototype.hasOwnProperty.call(requestBody, 'fname')) {
            const isfnameAlreadyUsed = await userModel.findOne({ fname: requestBody.fname });
            if (isfnameAlreadyUsed) {
                res.status(400).send({ status: false, message: `${requestBody.fname} fname  is already exists` })
                return
            }
            if (!validate.isValid(fname)) {
                return res.status(400).send({
                    status: false,
                    message: "fname is required or check its key & value",
                });
            }
        }

        if (Object.prototype.hasOwnProperty.call(requestBody, 'lname')) {
            const islnameAlreadyUsed = await userModel.findOne({ lname: requestBody.lname });
            // if (islnameAlreadyUsed) {
            //     res.status(400).send({ status: false, message: `${requestBody.fname} lname is already registered` })
            //     return
            // }
            if (!validate.isValid(lname)) {
                return res.status(400).send({
                    status: false,
                    message: "lname is required or check its key & value.",
                });
            }
        }

        if (Object.prototype.hasOwnProperty.call(requestBody, 'phone')) {
            const isphoneAlreadyUsed = await userModel.findOne({ phone: requestBody.phone });
            if (isphoneAlreadyUsed) {
                res.status(400).send({ status: false, message: `${requestBody.phone} phone number is already registered` })
                return
            }
            if (!validate.isValid(phone)) {
                return res.status(400).send({
                    status: false,
                    message: "phone is required or check its key & value.",
                });
            }
            if (!validate.isValidPhone(phone)) {
                res.status(400)
                    .send({ status: false, message: `${phone} is not a valid phone` });
                return;
            }
        }

        if (Object.prototype.hasOwnProperty.call(requestBody, 'email')) {
            if (!(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(requestBody.email))) {
                res.status(400).send({ status: false, message: `Email should be a valid email address` })
                return
            };
            const isEmailAlreadyUsed = await userModel.findOne({ email: requestBody.email });
            if (isEmailAlreadyUsed) {
                res.status(400).send({ status: false, message: `${requestBody.email} email address is already registered` })
                return
            };
        }

        if (password) { //trim()
            var encryptPass = await bcryptjs.hash(password, 10);
            if (!(password.length >= 8 && password.length <= 15)) {
                res.status(400).send({ status: false, message: "password should  between 8 and 15 characters" })
                return
            };
        }

        if (requestBody.address) {
            // requestBody.address = JSON.parse(requestBody.address)            if (requestBody.address.shipping) {
            if (requestBody.address.shipping.street) {
                UserFound.address.shipping.street = requestBody.address.shipping.street
                await UserFound.save()
            }
            if (requestBody.address.shipping.city) {
                UserFound.address.shipping.city = requestBody.address.shipping.city
                await UserFound.save()
            }
            if (requestBody.address.shipping.pincode) {
                UserFound.address.shipping.pincode = requestBody.address.shipping.pincode
                await UserFound.save()
            }
            if (requestBody.address.billing) {
                if (requestBody.address.billing.street) {
                    UserFound.address.billing.street = requestBody.address.billing.street
                    await UserFound.save()
                }
                if (requestBody.address.billing.city) {
                    UserFound.address.billing.city = requestBody.address.billing.city
                    await UserFound.save()
                }
                if (requestBody.address.billing.pincode) {
                    UserFound.address.billing.pincode = requestBody.address.billing.pincode
                    await UserFound.save()
                }
            }
        }
        // requestBody.UpdatedAt = new Date()

        if (profileImage && profileImage.length > 0) {

            var uploadedFileURL = await awsCon.uploadFile(profileImage[0]);
            console.log(uploadedFileURL)
            //     requestBody.profileImage = uploadedFileURL
        }

        const UpdateData = {
            fname,
            profileImage: uploadedFileURL,
            lname,
            email,
            phone,
            password: encryptPass
            // password: password ? encryptPass : "password is required"
        }
        requestBody.UpdatedAt = new Date()
        console.log(requestBody)

        const upatedUser = await userModel.findOneAndUpdate({ _id: userId }, UpdateData, { new: true })

        res.status(200).send({ status: true, message: 'User updated successfully', data: upatedUser });

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

//!login user localhost:3000/user/:userId/profile-------->
const login = async function (req, res) {
    try {
        const requestBody = req.body;
        if (!validate.isValidRequestBody(requestBody)) {
            return res.status(400).send({
                status: false,
                message: "Invalid request parameters. Please provide login details",
            });
        }
        // Extract params
        const { email, password } = requestBody;
        // Validation starts
        if (!validate.isValid(email)) {
            return res
                .status(400)
                .send({ status: false, message: `Email is required` });
        }

        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.trim())) {
            res
                .status(400)
                .send({ status: false, message: `${email} is not a valid email` });
            return;
        }

        if (!validate.isValid(password)) {
            return res
                .status(400)
                .send({ status: false, message: `Password is required` });
        }
        // Validation ends
        const user = await userModel.findOne({ email: email });
        // const userId = user._id

        if (!user) {
            return res
                .status(401)
                .send({ status: false, message: `Invalid login credentials` });
        }

        let decPass = await bcryptjs.compare(password, user.password);
        if (decPass) {
            const token = jwt.sign({ userId: user._id }, "radium", {
                expiresIn: "2h",
            });
            return res.status(200).send({
                status: true,
                message: `User login successfull 😁🤟🏻`,
                data: { userId: user._id, token },
            });
        } else {
            res.status(401).send({ status: false, message: "invalid password" })
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

module.exports = { registerUser, getUser, updateUserDetailes, login };