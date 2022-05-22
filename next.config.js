/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  api: {
    limit: '50mb',
    // limit: 52428800,
    bodyParser: false, // enable POST requests
    externalResolver: true, // hide warning message
  },
  // rewrites: async () => rewritesConfig
  // {
  //   return [
  //     {
  //       source: "/uploadshp",
  //       destination: "https://g-portal.herokuapp.com",
  //     }
  //   ]
  // }
}


const rewritesConfig =
  [
      {
        source: "/uploadshp",
        destination: "https://g-portal.herokuapp.com/uploadshp",
      },
    ]

    module.exports = nextConfig


// module.exports = {
//   async rewrites() {
//       return [
//         {
//           source: '/uploadshp',
//           destination: 'https://g-portal.herokuapp.com',
//         },
//       ]
//     },
// };