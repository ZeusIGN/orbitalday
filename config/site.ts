export type SiteConfig = typeof siteConfig;

export const siteConfig = {
    name: "Orbital",
    description: "A team first calendar.",
    gloabalNavItem: [
        {
            label: "Home",
            href: "/",
        },
        {
            label: "Register",
            userHidden: true,
            href: "/register",
        },
        {
            label: "Login",
            userHidden: true,
            href: "/login",
        },
    ],
    navItemsLoggedIn: [
        {
            label: "Workspaces",
            href: "/workspaces",
        },
        {
            label: "Teams",
            href: "/teams",
        },
        {
            label: "Logout",
            href: "/logout",
        },
    ],
    links: {
        github: "https://github.com/heroui-inc/heroui",
        twitter: "https://twitter.com/hero_ui",
        docs: "https://heroui.com",
        discord: "https://discord.gg/9b6yyZKmH4",
        sponsor: "https://patreon.com/jrgarciadev",
    },
};
