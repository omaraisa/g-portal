import styles from './bookmark.module.css'

export default function Bookmark({name,id,extent,deleteBookmark,view}) {
 
  return (    
    <div className={styles.bookmarkDiv}>
      <h5 onClick={()=> {view.goTo(extent)}}>{name}</h5>
       <i className={`esri-icon-close-circled ${styles.deleteBtn}`} onClick={()=> deleteBookmark(id)}></i> 
    </div>
  )
}
