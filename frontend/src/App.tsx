import './app.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Routes, Route, NavLink, Link } from "react-router";
import { Navbar as BootstrapNavbar, Nav, Container } from 'react-bootstrap';
import Home from './components/pages/Home.tsx';
import logo from "./assets/logo.png";

// See https://reactrouter.com/start/declarative/routing
const App = () => {
  return (
    <>
        <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="mb-4">
            <Container>
                <BootstrapNavbar.Brand as="a" href="/">
                    <img
                        alt="Getchief logo"
                        src={logo}
                        height="25"
                        className="d-inline-block align-top"
                />{' '}
                </BootstrapNavbar.Brand>
                <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
                <BootstrapNavbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={NavLink} to="/">Home</Nav.Link>
                    </Nav>
                </BootstrapNavbar.Collapse>
            </Container>
        </BootstrapNavbar>

        <Routes>
            <Route path="/" element={<Home />} />
        </Routes>
    </>
  );
};

export default App;
