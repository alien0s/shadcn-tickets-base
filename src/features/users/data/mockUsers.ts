export type UserRecord = {
  id: string;
  name: string;
  email: string;
  entity: string;
  avatar?: string;
};

export const mockUsers: UserRecord[] = [
  {
    id: "1",
    name: "Florence Shaw",
    email: "florence@untitledui.com",
    entity: "ANRA",
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU6TAn8zOX5VYek6Hq0ToTCdAbi0cyjHVQ8g&s",
  },
  {
    id: "2",
    name: "Amelie Laurent",
    email: "amelie@untitledui.com",
    entity: "ACeAm",
    avatar:
      "https://i.pinimg.com/736x/27/57/78/2757784d2e6f5d047987321cf8d5bb89.jpg",
  },
  {
    id: "3",
    name: "Ammar Foley",
    email: "ammar@untitledui.com",
    entity: "Asur",
    avatar:
      "https://64.media.tumblr.com/2958d96eff5c2fc0b4086c21982d23f5/8c516146086d2073-e9/s400x600/d426c64fe22bedc432adcc434512f4f2e83cf11a.png",
  },
  {
    id: "4",
    name: "Caitlyn King",
    email: "caitlyn@untitledui.com",
    entity: "MLA",
    avatar:
      "https://64.media.tumblr.com/85fbc70fa1a3feee7c8d101b016951a8/tumblr_plorzglJM01t8o0f1_640.jpg",
  },
  {
    id: "5",
    name: "Sienna Hewitt",
    email: "sienna@untitledui.com",
    entity: "UNoB",
    avatar:
      "https://64.media.tumblr.com/f96a783d595a44f728cf16d9c8cd92de/91943817594ce704-63/s1280x1920/fc8ac934dc7e234c80468204792ed713de3668ff.jpg",
  },
  {
    id: "6",
    name: "Olly Shroeder",
    email: "olly@untitledui.com",
    entity: "ANRA",
    avatar:
      "https://64.media.tumblr.com/828af31d21d56bbdd550145c06a996e2/f0f32dc6e6f1ae3a-e1/s400x600/e211852a1bdc89b24818163d1813d5eb1979cf04.png",
  },
  {
    id: "7",
    name: "Mathilde Lewis",
    email: "mathilde@untitledui.com",
    entity: "ACeAm",
    avatar:
      "https://64.media.tumblr.com/8709f271cbd317565e943ceb71392927/e5dbbf3d086bbd56-65/s400x600/58a0514133123c386aa27667d0d62aec46bcbc0b.png",
  },
  {
    id: "8",
    name: "Jaya Willis",
    email: "jaya@untitledui.com",
    entity: "Asur",
    avatar:
      "https://64.media.tumblr.com/1e4044a7cca8c148e0000844d9dbc2d2/070eeef01370ec67-4a/s540x810/b253278aee94cd594f146a6be22e3dfdcf24d0c4.jpg",
  },
];
