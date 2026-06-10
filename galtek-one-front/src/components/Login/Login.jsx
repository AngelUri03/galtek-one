// src/components/Login/Login.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import "../../style/components/Login/Login.css";

const Login = () => {
  return (
    <div className="login-container">
      <video autoPlay loop muted playsInline className="video-background">
        <source src="/videos/videofondo.mp4" type="video/mp4" />
      </video>

      <div className="login-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Login;
