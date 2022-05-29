// // const proxy = require("http-proxy-middleware")
// // import proxy from 'http-proxy-middleware'
// import proxy from 'next-http-proxy-middleware'

// module.exports = function (app) {
//     app.use(
//         proxy("/uploadshp", {
//             target: "https://g-portal.herokuapp.com/uploadshp",
//             // target: "http://localhost:5000",
//             changeOrigin:true,
//             secure:false,
//         })
//     )
// }