{ pkgs ? import <nixpkgs> { } }:

{
  packages = [
    pkgs.nodejs
    pkgs.yarn
    pkgs.nodePackages.typescript
  ];
}