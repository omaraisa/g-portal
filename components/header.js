import NavButton from './sub_components/nav-button'
import styles from './header.module.css'
import Image from 'next/image'

export default function Header(props) {
  return (
    <div className={styles.header}>
       <Image src="/images/logo.png" alt="me" width="40" height="40" />
      <h1 className={styles.title}>جي بورتال</h1>
      <NavButton iconClass="esri-icon-save" activeNav={props.activeSubMenu === "SaveMap"? true : false}   goTo={() => props.goTo("SaveMap")} />
      <NavButton iconClass="esri-icon-bookmark" activeNav={props.activeSubMenu === "Bookmarks"? true : false} goTo={() => props.goTo("Bookmarks")} />
      <NavButton iconClass="esri-icon-globe" activeNav={props.activeSubMenu === "Pane3"? true : false} goTo={() => props.goTo("Pane3")} />
      <NavButton iconClass="esri-icon-sketch-rectangle" activeNav={props.activeSubMenu === "Pane4"? true : false} goTo={() => props.goTo("Pane4")} />
      <NavButton iconClass="esri-icon-printer" activeNav={props.activeSubMenu === "Print"? true : false} goTo={() => props.goTo("Print")} />
      <NavButton iconClass="esri-icon-edit" activeNav={props.activeSubMenu === "Editor"? true : false} goTo={() => props.goTo("Editor")} />
      <NavButton iconClass="esri-icon-basemap" activeNav={props.activeSubMenu === "Basemap"? true : false} goTo={() => props.goTo("Basemap")} />
      <NavButton iconClass="esri-icon-description" activeNav={props.activeSubMenu === "GPortalInfo"? true : false} goTo={() => props.goTo("GPortalInfo")} />
      
    </div>
  )
}
