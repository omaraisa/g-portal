const supportedLayerTypes = ["csv", "feature", "geojson"]
export function listSupportedLayers(layers) {
    return layers.map((layer, index) => {
     if (supportedLayerTypes.includes(layer.type)) {
     return (
       <option key={layer.id} value={index}>
         {layer.title}
       </option>
     );
     }
   })
   }

 
export const allDataQuery = {
  outFields: ["*"],
  returnGeometry: true,
  where: "",
};

export const symbols = {
  point: {
    type: "simple-marker",
    style: "circle",
    color: "#202020",
    size: "8px",
  },
  polyline: {
    type: "simple-line",
    color: "#202020",
    width: 2,
  },
  polygon: {
    type: "simple-fill",
    color: "#202020",
    outline: {
      width: 2,
      color: "#fff",
    },
  },
};
