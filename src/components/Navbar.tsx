import "@mantine/core/styles.css";
import "@/css/Navbar.css";
import { NavLink } from "react-router-dom";
import FileUpload from "@/components/FileUpload";
import AuthOptions from "@/components/AuthOptions";
import AdminUsers from "@/components/AdminUsers";
import useAuthStatus from "@/hooks/useAuthStatus";
import { Button } from "@mantine/core";
import { IconHelp } from "@tabler/icons-react";

// Navigation Bar
const mainLinksData = [
  { name: "Files", url: "/" },
  { name: "Documentation", url: `/docs` },
];

export default function Navbar() {
  const { username, isLoading } = useAuthStatus();

  const links = mainLinksData.map(({ name, url }) => (
    <NavLink key={name} className="nav-link" to={url}>
      {name}
    </NavLink>
  ));

  return (
    <nav id="navbar">
      {/* Brand: logo and title, anchored to the left */}
      <div className="navbar-brand">
        <img
          src={`${import.meta.env.BASE_URL}favicon.ico`}
          alt="Logo"
          className="navbar-icon"
        />
        <h3 className="hytechName">HyTech Data Acquisition</h3>
      </div>

      {/* Primary navigation links */}
      <div className="navbar-links">{links}</div>

      {/* Actions, pushed to the right edge */}
      <div className="navbar-actions">
        <Button
          variant="filled"
          component="a"
          target="_blank"
          aria-label="Help"
          href="https://wiki.hytechracing.org/books/software/page/query-frontend-demo-and-documentation"
        >
          <IconHelp size="20" />
        </Button>
        {username != null && <FileUpload />}
        {username != null && <AdminUsers />}
        <AuthOptions username={username} isLoading={isLoading} />
      </div>
    </nav>
  );
}
