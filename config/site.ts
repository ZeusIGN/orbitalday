export type SiteConfig = typeof siteConfig;

export const siteConfig = {
    name: "Orbital",
    description: "A team first calendar.",
    navItemsLoggedOut: [
        {
            label: "Home",
            href: "/",
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
            label: "Profile",
            href: "/profile",
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
