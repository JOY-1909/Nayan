import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { useToast } from "../context/ToastContext";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  FormGroup,
  Form,
  Input,
  Row,
  Col,
} from "reactstrap";

import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";

const SignInForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [succesMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const triggerToast = useToast();

  const handleSignIn = async (e) => {
    e.preventDefault();

    try {
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      setSuccessMessage("You have successfully logged in");
      setError("");
      triggerToast("You have successfully logged in", "success");
      triggerToast("Welcome To DashBoard", "info");
      navigate("/dashboard");
    } catch (err) {
      console.error("Sign in error:", err);
      setError(err.message || "Invalid email or password");
      setSuccessMessage("");
      triggerToast("Invalid email or password", "error");
    }

    // Clear input fields
    setEmail("");
    setPassword("");
  };

  const handleGoogleSignIn = async () => {
    try {
      await setPersistence(auth, browserSessionPersistence);
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      console.log("userId from google Login", userCredential.user.uid);
      triggerToast("You have successfully logged in with Google", "success");
      navigate("/dashboard");
    } catch (err) {
      console.error("Google sign in error:", err);
      setError(err.message || "Google sign-in failed");
      triggerToast("Google sign-in failed", "error");
    }
  };

  return (
    <div className="container">
      <Row className="justify-content-center align-items-center h-100 mt-4">
        <Col>
          <h3 className="text-center font-weight-bold mb-4">Nayan</h3>
        </Col>
      </Row>

      <Row className="justify-content-center align-items-center h-100 ">
        <Col lg="4" md="6" sm="12">
          <Card
            className="card-user"
            style={{
              backgroundColor: "#E0F7FA",
              boxShadow: "0px 10px 20px rgba(0.1, 0.3, 0.3, 0.5)",
            }}
          >
            <div className="image">
              <img alt="..." src={require("../assets/img/login-bg.png")} />
              <i className="nc-single-02"></i>
            </div>
            <CardBody>
              <div className="author">
                <a href="#pablo" onClick={(e) => e.preventDefault()}>
                  <img
                    alt="..."
                    className="avatar border-gray"
                    src={require("../assets/img/default-avatar.png")}
                  />
                  <h5 className="title" style={{ color: "#0B486B" }}>
                    SIGN IN
                  </h5>
                </a>
              </div>
              <Col className="pl-1" md="12">
                <FormGroup>
                  <form onSubmit={handleSignIn}>
                    <label
                      htmlFor="email"
                      style={{
                        color: "#4f4f4f",
                        fontSize: "15px",
                        fontWeight: "600",
                      }}
                    >
                      Email:
                    </label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />

                    <label
                      htmlFor="password"
                      style={{
                        color: "#4f4f4f",
                        fontSize: "15px",
                        marginTop: "5px",
                        fontWeight: "600",
                      }}
                    >
                      Password:
                    </label>
                    <Input
                      type="password"
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />

                    <p style={{ color: "red" }}>{error}</p>
                    <p style={{ color: "green" }}>{succesMessage}</p>
                    <div className="update ml-auto mr-auto text-center">
                      <Button
                        className="btn-round"
                        color="primary"
                        type="submit"
                        style={{ backgroundColor: "#0B486B" }}
                      >
                        Sign In
                      </Button>
                    </div>
                  </form>
                </FormGroup>
              </Col>
            </CardBody>
            <CardFooter>
              <hr />
              <div className="button-container">
                <Row>
                  <div className="update ml-auto mr-auto">
                    <Button onClick={handleGoogleSignIn}>
                      Sign in with Google
                    </Button>
                  </div>
                </Row>
              </div>
            </CardFooter>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SignInForm;
