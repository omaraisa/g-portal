export const supportedLayerTypes = ["csv", "feature", "geojson"]
export function listSupportedLayers(layers,geometry=null) {
    return geometry? 
    layers.map((layer, index) => {
        if (supportedLayerTypes.includes(layer.type) && layer.geometryType === geometry) {
        return (
          <option key={layer.id} value={index}>
            {layer.title}
          </option>
        );
        }
      })
      :
      layers.map((layer, index) => {
       if (supportedLayerTypes.includes(layer.type)) {
       return (
         <option key={layer.id} value={index}>
           {layer.title}
         </option>
       );
       }
     })
   
   }

   
  export const handleLayersNumChange = ({state,setState,inputNumberOfLayers,minNumber=1,maxNumber=10}) => {
    if(inputNumberOfLayers >=minNumber && inputNumberOfLayers <=maxNumber)
    {
    let newLayers = [];
    const deltaLayersNumber = inputNumberOfLayers - state.layers.length;
    inputNumberOfLayers > state.layers.length
      ? (newLayers = addLayers())
      : (newLayers = dropLayers());

    function addLayers() {
      const tempLayers = [];
      for (let i = 0; i < deltaLayersNumber; i++) {
        const id = Math.floor(new Date().getTime())+Math.floor(Math.random() * 999);
        const newLayer = {
          id: id,
          layer:null,
        }
        tempLayers.push(newLayer);
      }
      return [...state.layers, ...tempLayers];
    }

    function dropLayers() {
      const tempLayers = [...state.layers];
      tempLayers.length = inputNumberOfLayers;
      return tempLayers;
    }

    setState({ ...state, layers: newLayers,allInputsValid:inputsChecker(newLayers) });
  }
  }

  export const updateLayers = ({ state,setState,layers, id, mapLayerIndex}) => {
    const unionLayers = state.layers.map(input => {
      if(input.id === id)
      {
        input.layer = layers[mapLayerIndex]
      }
      return input
    })
    setState({...state, layers:unionLayers,allInputsValid:inputsChecker(unionLayers)})
  }
  export const deleteLayer = ({ state, setState, numberOfLayersRef,id }) => {
    const unionLayers = state.layers.filter((layer) => layer.id !== id)
    if(unionLayers.length < 1)
    {
      unionLayers.push({
        id: Math.floor(new Date().getTime())+Math.floor(Math.random() * 999),
        layer:null,
      })
    }
    numberOfLayersRef.current.value = unionLayers.length
    setState({...state, layers:unionLayers,allInputsValid:inputsChecker(unionLayers)})
  }

  export const inputsChecker = (layers) => {
    const allInputsValid = layers.every(input => input.layer? true : false)
    return allInputsValid
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
