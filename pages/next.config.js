

module.exports = {
    async rewrites() {
        return [
          {
            source: '../components/submenu_components/add-uploaded-layer',
            destination: 'http://localhost:5000/uploadshp',
          },
        ]
      },
  };