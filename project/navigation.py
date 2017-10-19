from flask_navigation import Navigation


nav = Navigation()

nav.Bar('top', [
    nav.Item('Home', 'index'),
    nav.Item('Authors', 'authors'),
    nav.Item('Books', 'books'),
    nav.Item('Useful links', 'links'),
    nav.Item('About', 'about')
])
