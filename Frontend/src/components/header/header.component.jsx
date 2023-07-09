import React from 'react'
import './header.styles.scss'
import { Link } from 'react-router-dom'
import MyGif from '../../assets/globe.gif'

class Header extends React.Component {

    render() {
        return (
            <div className='header-container'>
                <Link className='logo-container' to='/'>
                    <img src={MyGif} alt="Logo" className='logo' />
                </Link>

                <div className='link-container'>
                    <Link to='/excel'>Excel </Link>
                    <Link to='/geoparsetext'>Text </Link>
                    <Link to='/placelookup'>Place Lookup </Link> 
                </div>
            </div>
        )
    }
}


export default Header
