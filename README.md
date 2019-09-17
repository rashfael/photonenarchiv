# photonenarchiv

a vue/nuxt/webpack based static gallery.

## Features

- multiple albums
- progressive image loading with initial blurred preview
- flickr-style image grid

## Future Features

- Metadata Display
- build caching
- multi-threaded image processing

## Installation and usage

Albums live in `albums/`, create a folder for each album.
```
┣━━ albums
┃   ┣━━ my-album
┃   ┃   ┣━━ index.yml (mandatory)
┃   ┃   ┣━━ thumbnail.jpg (mandatory)
┃   ┃   ┣━━ picture1.jpg
┃   ┃   ┣━━ …
```

images must have a unique name without the file ending!

album config index.yml:
```
name: My Album
```

```
npm ci
npm run generate
```
