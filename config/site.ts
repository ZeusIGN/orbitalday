export type SiteConfig = typeof siteConfig;

export const siteConfig = {
    name: "Orbital",
    description: "A team first calendar.",
    gloabalNavItem: [
        {
            label: "Home",
            labelKey: "nav.home",
            href: "/",
        },
        {
            label: "Register",
            labelKey: "nav.register",
            userHidden: true,
            href: "/register",
        },
        {
            label: "Login",
            labelKey: "nav.login",
            userHidden: true,
            href: "/login",
        },
    ],
    navItemsLoggedIn: [
        {
            label: "Workspaces",
            labelKey: "nav.workspaces",
            href: "/workspaces",
        },
        {
            label: "Teams",
            labelKey: "nav.teams",
            href: "/teams",
        },
        {
            label: "Logout",
            labelKey: "nav.logout",
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
