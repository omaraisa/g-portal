import Legend from '@arcgis/core/widgets/Legend'

export const widgetsManager = async (view,widgetName,availability) => {
 
  // return ("done!")
    // let promise = new Promise((resolve, reject) => {
      setTimeout(() => {return ("done!")}, 1000)
    // });
    
    
    
  // return new Promise(_ => {
//   switch (widgetName) {
//     case 'legend':
//       return addLegend(view,availability);  
      

//     default:
//       return {type:"error", title:"إجراء خاطئ", body:"فشلت عملية إضافة الأداة"}
     
//   }
// // }
// }
//     switch (widgetName) {
//       case 'legend':
//         return addLegend(view,availability);  
        

//       default:
//         return {type:"error", title:"إجراء خاطئ", body:"فشلت عملية إضافة الأداة"}
       
//     }
}

const addLegend = (view,availability) => {
  if(availability) {
    setTimeout(_ => console.log("done"),3000)
  import("@arcgis/core/widgets/Legend").then(
    _ => {
      return new Legend({view: view,})}
        )
      }
}