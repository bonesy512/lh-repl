import React from 'react';
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@nextui-org/react';
import Link from 'next/link'; // Assuming Next.js for routing


function MyDropdown() {
  return (
    <Dropdown>
      <DropdownTrigger>
        <button>Menu</button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Dropdown menu">
        <DropdownItem>
          <Link href="/profile">Profile</Link>
        </DropdownItem>
        <DropdownItem>
          <Link href="/settings">Settings</Link>
        </DropdownItem>
        <DropdownItem>
          <Link href="/team-management">Team Management</Link>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}

export default MyDropdown;