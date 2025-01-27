# InnerSourcerers Map 🌍

An interactive globe visualization showing the geographical distribution of InnerSource Foundation members across the world. The application features a 3D globe with highlighted countries where members are located, along with a detailed side panel showing member information organized by country.

## Features

- 🌐 Interactive 3D globe visualization
- 🎯 Country highlighting for member locations
- 📋 Organized member list by country
- 🔗 Social media links for members
- 🖱️ Click-to-zoom country navigation
- 📱 Responsive design

## Live Demo

Visit [https://innersourcecommons.github.io/innersourcerers-map/](https://innersourcecommons.github.io/innersourcerers-map/) to see the live application.

## Technology Stack

- Globe Visualization: [Globe.gl](https://globe.gl/)
- Map Data: [World Atlas TopoJSON](https://github.com/topojson/world-atlas)
- Member Data: YAML
- Icons: [Font Awesome](https://fontawesome.com/)
- Styling: Custom CSS

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/InnerSourceCommons/innersourcerers-map.git
cd innersourcerers-map
```

2. Start a local server:
```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js
npx http-server
```

3. Open your browser and navigate to `http://localhost:8000`

## Data Structure

Member data is stored in `data/members.yaml` with the following structure:

```yaml
members:
  - name: "Member Name"
    role: "Role Title"
    area: "Country"
    linkedin: "LinkedIn URL"  # Optional
    twitter: "Twitter URL"    # Optional
    website: "Website URL"    # Optional
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all InnerSource Foundation members for their contributions
- Globe.gl library for the amazing 3D globe visualization
- World Atlas for providing the geographical data
