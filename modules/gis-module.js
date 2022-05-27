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
      color: "#202020",
    },
  },
};



const actionsSections = 
{
  feature: [
    [
      {
        //title: "Go to full extent",
        title: "عرض كامل البيانات",
        className: "esri-icon-zoom-out-fixed",
        id: "fullExtent",
      },
      {
        //title: "Attribute Table",
        title: "البيانات الوصفية",
        className: "esri-icon-table",
        id: "attributeTable",
      },
      {
            //title: "labeling",
            title: "النصوص",
            className: "esri-icon-labels",
            id: "labeling",
          },
    ],
    //   {
    //     //title: "Attribute Table",
    //     title: "استخراج البيانات",
    //     className: "esri-icon-download",
    //     id: "exportData",
    //   },
    // ],
    // [
    //   {
    //     //title: "Symbology",
    //     title: "التمثيل",
    //     className: "esri-icon-maps",
    //     id: "symbology",
    //   },
    //  
    //   {
    //     //title: "Popup Window",
    //     title: "النافذة المنبثقة",
    //     className: "esri-icon-configure-popup",
    //     id: "popup",
    //   },
    // ],
    [
      {
        //title: "Move Up",
        title: "التحريك لأعلى",
        className: "esri-icon-up-arrow",
        id: "moveUp",
      },
      {
        //title: "Move Down",
        title: "التحريك لأسفل",
        className: "esri-icon-down-arrow",
        id: "moveDown",
      },
    ],
    [
      {
        //title: "Delete Layer",
        title: "حذف الطبقة",
        className: "esri-icon-close",
        id: "deleteLayer",
      },
    ],
  ]
}


export const pointSymbolStyles = [{style:"circle",name:"دائرة"},{style:"square",name:"مربع"},{style:"diamond",name:"معين"},{style:"triangle",name:"مثلث"},{style:"cross",name:"زائد"},{style:"x",name:"تقاطع"}]
export const lineSymbolStyles = [{style:"solid",name:"متصل"},{style:"dash",name:"متقطع"},{style:"dash-dot",name:"خط ونقطة"},{style:"dot",name:"نقاط"},{style:"short-dot",name:"نقاط متقاربة"},{style:"short-dash-dot-dot",name:"خط ونقطتين"}]
export const polygonSymbolStyles = [{style:"solid",name:"مصمت"},{style:"vertical",name:"خطوط رأسية"},{style:"horizontal",name:"خطوط أفقية"},{style:"backward-diagonal",name:"خطوط جانبية 1"},{style:"forward-diagonal",name:"خطوط جانبية 2"},{style:"diagonal-cross",name:"خطوط متقاطعة"}]
export function listSymbolStyles(geometry="point") {
  const symbolsGeometry = {
    point : pointSymbolStyles,
    polyline : lineSymbolStyles,
    polygon : polygonSymbolStyles,
  }
  const symbols = symbolsGeometry[geometry]
    return (
      symbols.map((symbol, index) => {
         return (
          <option key={index} value={symbol.style}>
          {symbol.name}
        </option>
         );
       })
    )
   
   }