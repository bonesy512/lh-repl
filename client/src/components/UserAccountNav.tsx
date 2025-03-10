
import React from 'react';
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@nextui-org/react';
import { Link } from 'wouter'; // Using wouter for routing based on App.tsx

function UserAccountNav() {
  return (
    <Dropdown>
      <DropdownTrigger>
        <button className="flex items-center gap-2 rounded-md p-2 hover:bg-muted">
          <span>Menu</span>
        </button>
      </DropdownTrigger>
      <DropdownMenu aria-label="User account menu">
        <DropdownItem>
          <Link href="/dashboard">Dashboard</Link>
        </DropdownItem>
        <DropdownItem>
          <Link href="/profile">Profile</Link>
        </DropdownItem>
        <DropdownItem>
          <Link href="/settings">Settings</Link>
        </DropdownItem>
        <DropdownItem>
          <Link href="/team-management">Team Management</Link>
        </DropdownItem>
        <DropdownItem>
          <Link href="/purchase-tokens">Purchase Credits</Link>
        </DropdownItem>
        <DropdownItem>
          <button onClick={() => { /* Add logout logic here */ }}>
            Logout
          </button>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}

export default UserAccountNav;
