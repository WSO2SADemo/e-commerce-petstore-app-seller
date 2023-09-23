import React, { useEffect } from 'react';
import { Container, Button, Table } from 'react-bootstrap';
import { useState } from 'react';
// import { useAuthContext } from "@asgardeo/auth-react";
import { manualSignIn, manualGetToken, manualSignOut } from '../Authenticator/Auth.js';
import { default as authConfig } from "../../config.json";
import { useAuthContext } from '../context/authContext';
import { parseJwt } from '../util';
import '../css/popup.css';
const axios = require('axios');

export default function Admin() {
    const [authorizationCode, setAuthorizationCode] = useState();
    const [selectedRow, setSelectedRow] = useState(null);
    const [code, setCode] = useState("");
    const [catalogUpdateToggle, setCatalogUpdateToggle] = useState(false);
    const { handleLogin, handleLogout, handleToken, handleIDToken, isAuthenticated, token, idToken } = useAuthContext();
    var codeResponse = "";
    const [catalog, setCatalog] = useState([]);
    const [cart, setCartItem] = useState([]);
    const [isAdmin, setAdmin] = useState(false);
    const [isCustomer, setCustomer] = useState(false);
    const [popupContent, setPopupContent] = useState("");
    const [isPopupVisible, setPopupVisible] = useState(false);
    const [isLogoutState, setIsLogoutState] = useState(false);
    var gatewayURL;

    const handleOkClick = () => {
        console.log("OK button clicked!");
        // Close the popup
        setPopupVisible(false);
        if (isLogoutState) {
            manualSignOut();
        }
    }

    useEffect(() => {
        document.title = "Admin | PetStore";
        if (authConfig.IS.enabled == true) {
            gatewayURL = authConfig.IS.endpointURL;
        } else {
            gatewayURL = authConfig.Auth0.endpointURL;
        }
    }, []);

    var items = [];

    useEffect(() => {
        console.log("-- Admin useEffect[token, catalogUpdateToggle] --");
        console.log(token);
        var scopeURI;
        var scopeAdmin;
        var scopeCustomer;
        if (authConfig.IS.enabled == true) {
            scopeURI = authConfig.IS.scopeURI;
            scopeAdmin = authConfig.IS.scopeAdmin;
            scopeCustomer = authConfig.IS.scopeCustomer;
            gatewayURL = authConfig.IS.endpointURL;
        } else {
            scopeURI = authConfig.Auth0.scopeURI;
            scopeAdmin = authConfig.Auth0.scopeAdmin;
            scopeCustomer = authConfig.Auth0.scopeCustomer;
            gatewayURL = authConfig.Auth0.endpointURL;
        }
        if (token && token.length != 0) {
            console.log("ID TOKEN: " + idToken);
            var decodedToken = parseJwt(idToken);
            var scopes = decodedToken[scopeURI];
            var email = decodedToken["email"];
            var department = decodedToken["department"];
            console.log(scopes);
            if (scopes.includes(scopeAdmin)) {
                console.log("SCOPE is Logged in." + scopes)
                console.log("In catalog useEffect for TOKEN");
                console.log("Received token: " + token);
                const url = gatewayURL + '/items?sellerId=' + department;
                console.log("Received gatewayURL: " + gatewayURL);
                if (scopes.includes(scopeAdmin)) {
                    setAdmin(true);
                } else {
                    setAdmin(false);
                }
                if (scopes.includes(scopeCustomer)) {
                    setCustomer(true);
                } else {
                    setCustomer(false);
                }
                var headers = {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                };

                try {
                    const fetchCatalogs = async () => {
                        const result = await axios.get(url, { headers });
                        return result.data;
                    };
                    const fetchData = async () => {
                        const catData = await fetchCatalogs();
                        console.log(catData);
                        setCatalog(catData);
                        if (catData.length < 1) {
                            setPopupVisible(true);
                            setIsLogoutState(false);
                            setPopupContent("There are no items available to sell from your " + department + " department. Please Add Items");
                        }
                    };
                    fetchData();
                    // Work with the response...
                } catch (err) {
                    // Handle error
                    console.log(err.response.data.description);
                    setPopupVisible(true);
                    setIsLogoutState(false);
                    setPopupContent(err.response.data.description);
                }
            } else {
                setAdmin(false);
                console.log("SCOPE ADMIN or CUSTOMER is not in the scope list")
            }
        }
    }, [token, catalogUpdateToggle]);


    useEffect(() => {
        var signInRedirectURL;
        if (authConfig.IS.enabled == true) {
            signInRedirectURL = authConfig.IS.signInRedirectURL;
        } else {
            signInRedirectURL = authConfig.Auth0.signInRedirectURL;
        }
        console.log("In Admin.js: useEffect, isAuthenticated: " + JSON.stringify(isAuthenticated));
        const redirectUrl = window.location.href;
        codeResponse = new URL(redirectUrl).searchParams.get("code");
        if (codeResponse != null || code != "") {
            handleLogin();
            setCode(codeResponse);
            console.log("Received code: " + codeResponse + " token: " + token);
            if (token == null) {
                manualGetToken(codeResponse, signInRedirectURL)
                    .then((tokenResponse) => {
                        console.log("------------ token in manualGetToken() -------------- ");
                        console.log(tokenResponse);
                        if (authConfig.IS.enabled == true) {
                            handleToken(tokenResponse.access_token);
                            handleIDToken(tokenResponse.id_token);
                        } else {
                            handleToken(tokenResponse.id_token);
                            handleIDToken(tokenResponse.id_token);
                        }
                    })
                    .catch((error) => {
                        setPopupVisible(true);
                        setIsLogoutState(true);
                        setPopupContent(error.response.data.description);
                    });
            }
        }
    }, []);

    const handleRowClick = (row) => {
        setSelectedRow(row);
    };

    const editCartItem = (id) => {
        const trElement = document.getElementById(id);
        const tdElements = trElement.querySelectorAll("td");
        var isEditable = false;
        for (const tdElement of tdElements) {
            if (!tdElement.querySelector("button")) {
                if (tdElement.contentEditable == "true") {
                    isEditable = true;
                    break;
                }
            }
        }
        if (isEditable) {
            for (const tdElement of tdElements) {
                if (!tdElement.querySelector("button")) {
                    tdElement.contentEditable = "false";
                } else {
                    const buttons = tdElement.querySelectorAll("Button");
                    for (const button of buttons) {
                        if (button.innerHTML == "Cancel") {
                            button.innerHTML = "Edit";
                        } else if (button.innerHTML == "Update") {
                            button.innerHTML = "Remove";
                        }
                    }
                }
            }
        } else {
            for (const tdElement of tdElements) {
                if (!tdElement.querySelector("button")) {
                    tdElement.contentEditable = "true";
                } else {
                    const buttons = tdElement.querySelectorAll("Button");
                    for (const button of buttons) {
                        if (button.innerHTML == "Edit") {
                            button.innerHTML = "Cancel";
                        } else if (button.innerHTML == "Remove") {
                            button.innerHTML = "Update";
                        }
                    }
                }
            }
        }
        console.log(trElement);
    };

    const deleteOrUpdateCartItem = (id) => {
        if (authConfig.IS.enabled == true) {
            gatewayURL = authConfig.IS.endpointURL;
        } else {
            gatewayURL = authConfig.Auth0.endpointURL;
        }
        const trElement = document.getElementById(id);
        const tdElements = trElement.querySelectorAll("td");
        var isEditable = false;
        for (const tdElement of tdElements) {
            if (tdElement.querySelector("button")) {
                const buttons = tdElement.querySelectorAll("Button");
                for (const button of buttons) {
                    if (button.innerHTML == "Remove") {
                        const payload = { id: parseInt(id) };
                        console.log("in item deletion: " + token);
                        console.log(payload);
                        var url = gatewayURL + '/item?idstring=' + id;
                        var headers = {
                            'Authorization': 'Bearer ' + token,
                            'Content-Type': 'application/json',
                            // 'Access-Control-Allow-Origin': '*'
                        };
                        try {
                            const removeFromCatalog = async () => {
                                console.log("Catalog item removING")
                                const result = await axios.delete(url, { headers: headers });
                                console.log("Catalog item removed")
                                catalogUpdateToggleSwitch();
                                return result.data;
                            };
                            removeFromCatalog();
                            // Work with the response...
                        } catch (err) {
                            // Handle error
                            console.log(err.response.data.description);
                            setPopupVisible(true);
                            setIsLogoutState(false);
                            setPopupContent(err.response.data.description);
                        }

                    } else if (button.innerHTML == "Update") {
                        const title = document.getElementById(id + "_title").innerHTML;
                        const description = document.getElementById(id + "_description").innerHTML;
                        const includes = document.getElementById(id + "_includes").innerHTML;
                        const irntendedFor = document.getElementById(id + "_intendedFor").innerHTML;
                        const color = document.getElementById(id + "_color").innerHTML;
                        const material = document.getElementById(id + "_material").innerHTML;
                        const price = parseFloat(document.getElementById(id + "_price").innerHTML);
                        const payload = { id: id, title: title, description: description, includes: includes, intendedFor: irntendedFor, color: color, material: material, price: price };
                        const url = gatewayURL + '/item';
                        console.log("token: " + token);
                        console.log("IDtoken: " + idToken);
                        const headers = {
                            'Authorization': 'Bearer ' + token,
                            'Content-Type': 'application/json',
                            // 'Access-Control-Allow-Origin': '*'
                        };
                        try {
                            const addToCatalog = async () => {
                                const result = await axios.put(url, payload, { headers });
                                for (const tdElement of tdElements) {
                                    if (!tdElement.querySelector("button")) {
                                        tdElement.contentEditable = "false";
                                    } else {
                                        const buttons = tdElement.querySelectorAll("Button");
                                        for (const button of buttons) {
                                            if (button.innerHTML == "Cancel") {
                                                button.innerHTML = "Edit";
                                            } else if (button.innerHTML == "Update") {
                                                button.innerHTML = "Remove";
                                            }
                                        }
                                    }
                                }
                                return result.data;
                            };
                            addToCatalog();
                            // Work with the response...
                        } catch (err) {
                            // Handle error
                            console.log(err.response.data.description);
                            setPopupVisible(true);
                            setIsLogoutState(false);
                            setPopupContent(err.response.data.description);
                        }

                    }
                }
            }
        }
    };

    const catalogUpdateToggleSwitch = () => {
        if (catalogUpdateToggle == true) {
            setCatalogUpdateToggle(false);
        } else {
            setCatalogUpdateToggle(true);
        }
    }

    const addNewCartItem = (newid) => {
        console.log(newid);
        var decodedToken = parseJwt(idToken);
        const department = decodedToken["department"];
        const id = -1;
        const title = document.getElementById("newtitle").innerHTML;
        const description = document.getElementById("newdescription").innerHTML;
        const includes = document.getElementById("newincludes").innerHTML;
        const irntendedFor = document.getElementById("newintendedFor").innerHTML;
        const color = document.getElementById("newcoler").innerHTML;
        const material = document.getElementById("newmaterial").innerHTML;
        const price = parseFloat(document.getElementById("newprice").innerHTML);
        const payload = { id: id, title: title, description: description, includes: includes, intendedFor: irntendedFor, color: color, material: material, price: price, sellerId: department };
        console.log(payload);
        if (authConfig.IS.enabled == true) {
            gatewayURL = authConfig.IS.endpointURL;
        } else {
            gatewayURL = authConfig.Auth0.endpointURL;
        }
        const url = gatewayURL + '/item';
        const headers = {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            // 'Access-Control-Allow-Origin': '*'
        };
        try {
            const addToCatalog = async () => {
                const result = await axios.post(url, payload, { headers });
                catalogUpdateToggleSwitch();
                document.getElementById("newtitle").innerHTML = "";
                document.getElementById("newdescription").innerHTML = "";
                document.getElementById("newincludes").innerHTML = "";
                document.getElementById("newintendedFor").innerHTML = "";
                document.getElementById("newcoler").innerHTML = "";
                document.getElementById("newmaterial").innerHTML = "";
                document.getElementById("newprice").innerHTML = "";
                return result.data;
            };
            addToCatalog();
            // Work with the response...
        } catch (err) {
            // Handle error
            console.log(err.response.data.description);
            setPopupVisible(true);
            setIsLogoutState(false);
            setPopupContent(err.response.data.description);
        }


    };

    if (isAuthenticated) {
        if (isAdmin) {
            console.log("Logged in user is an ADMIN");
            var numberOfItems = catalog.length + 1;
            return (
                <>
                    <Container className="mt-5">
                        <Table bordered hover>
                            <thead>
                                <tr>
                                    {/* <th scope="col" width="150px">ID</th> */}
                                    <th scope="col" width="150px">Title</th>
                                    <th scope="col" width="400px">Description</th>
                                    <th scope="col">Includes</th>
                                    <th scope="col">Intended For</th>
                                    <th scope="col" width="50px">Color</th>
                                    <th scope="col">Material</th>
                                    <th scope="col">Price</th>
                                    <th scope="col">Actions</th>
                                </tr>
                                {catalog.map(cat => (
                                    <tr className="align-middle" key={cat.ID} id={cat.ID} row={cat.ID} onClick={handleRowClick}>
                                        <td id={cat.ID + "_title"}>{cat.Title}</td>
                                        <td id={cat.ID + "_description"}>{cat.Description}</td>
                                        <td id={cat.ID + "_includes"}>{cat.Includes}</td>
                                        <td id={cat.ID + "_intendedFor"}>{cat.IntendedFor}</td>
                                        <td id={cat.ID + "_color"}>{cat.Color}</td>
                                        <td id={cat.ID + "_material"}>{cat.Material}</td>
                                        <td id={cat.ID + "_price"}>{cat.Price}</td>
                                        <td>
                                            <Button variant="warning" size="sm" onClick={() => editCartItem(cat.ID)}>Edit</Button>
                                            <Button variant="danger" size="sm" onClick={() => deleteOrUpdateCartItem(cat.ID)}>Remove</Button>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="text-end">
                                    <td id='newtitle' contentEditable='true'></td>
                                    <td id='newdescription' contentEditable='true'></td>
                                    <td id='newincludes' contentEditable='true'></td>
                                    <td id='newintendedFor' contentEditable='true'></td>
                                    <td id='newcoler' contentEditable='true'></td>
                                    <td id='newmaterial' contentEditable='true'></td>
                                    <td id='newprice' contentEditable='true'></td>
                                    <td colSpan="8"><Button variant="success" className="float-right" onClick={() => addNewCartItem(numberOfItems)}>Add New Product</Button></td>
                                </tr>
                            </thead>
                        </Table>
                        {isPopupVisible && (
                            <div className="popup">
                                <div className="popup-content">
                                    <h2>Error</h2>
                                    <p>{popupContent}</p>
                                    <button onClick={handleOkClick} className="popup-button">OK</button>
                                    {/* <button onClick={() => setPopupVisible(false)} className="popup-button">Cancel</button> */}
                                </div>
                            </div>
                        )}
                    </Container>
                </>
            );
        } else {
            console.log("Logged in user is NOT an ADMIN");
            return (
                <>
                    <Container className="mt-5">
                        <h1>Admin</h1>
                        <p>You must be an Admin in to view this page. Logout and Sign in Again</p>
                    </Container>
                </>
            )
        }


    } else {
        return (
            <>
                <Container className="mt-5">
                    <h1>Admin</h1>
                    <p>You must be logged in to view this page.</p>
                    <Button variant="primary" onClick={() => manualSignIn()}>Login</Button>
                </Container>
            </>
        )
    }


}

async function catalogUpdateToggleSwitch() {

}