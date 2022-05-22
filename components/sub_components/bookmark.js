import styles from './bookmark.module.css'
import Extent from "@arcgis/core/geometry/Extent";

export default function Bookmark({name,id,extent,deleteBookmark,view}) {
 function goToExtent()  {
   extent.type
   ? view.goTo(extent)
   : view.goTo(Extent.fromJSON(extent))
  }
  return (    
    <div className={styles.bookmarkDiv}>
      <h5 onClick={()=>goToExtent()}>{name}</h5>
       <i className={`esri-icon-close-circled ${styles.deleteBtn}`} onClick={()=> deleteBookmark(id)}></i> 
    </div>
  )
}
