{
  description = "@tstelzer/effect-kitchensink";
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  outputs = { self, nixpkgs }:
    let pkgs = nixpkgs.legacyPackages.x86_64-linux;
    in
    {
      devShell.x86_64-linux = pkgs.mkShell {
        nativeBuildInputs = [ pkgs.bashInteractive ];
        buildInputs = with pkgs; [ nodejs-18_x ];
        shellHook = ''
          mkdir -p .corepack && corepack enable --install-directory="./.corepack"
          export PATH=$PATH:$(cd .corepack; pwd)
        '';
      };
    };
}
