/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig


// module.exports = {
//   async rewrites() {
//       return [
//         {
//           source: './ccomponents/submenu_components/add-uploaded-layer',
//           destination: 'http://localhost:5000/uploadshp',
//         },
//       ]
//     },
// };