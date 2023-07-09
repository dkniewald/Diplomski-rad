import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from mordecai import Geoparser
from elasticsearch import Elasticsearch
import numpy as np
import spacy
from pyproj import Transformer, Geod

app = Flask(__name__)
CORS(app)
CORS(app, origins='http://34.154.166.250')

geo = Geoparser(spacy.load('hr_core_news_lg'))

wgs = 'epsg:4326'


def parse_float(results):
    new_results = []
    for result in results:
        new_result = {k: float(v) if isinstance(v, np.float32) else v for k, v in result.items()}
        new_results.append(new_result)
    return new_results


# def calculate_difference(coord, geoparsed_text):
#     if geoparsed_text and 'geo' in geoparsed_text[0]:
#         lat1, lon1 = coord
#         lat = float(geoparsed_text[0]['geo']['lat'])
#         lon = float(geoparsed_text[0]['geo']['lon'])
#         return abs(lat1 - lat), abs(lon1 - lon)
#     else:
#         return None, None


def calculate_difference(coord, geoparsed_text):
    smallest_diff = float('inf')
    smallest_diff_item = None
    for item in geoparsed_text:
        if 'geo' in item:
            lat1, lon1 = coord
            lat = float(item['geo']['lat'])
            lon = float(item['geo']['lon'])
            diff_lat, diff_lon = abs(lat1 - lat), abs(lon1 - lon)
            avg_diff = (diff_lat + diff_lon) / 2
            if avg_diff < smallest_diff:
                smallest_diff = avg_diff
                smallest_diff_item = (item, diff_lat, diff_lon)
    if smallest_diff_item is None:
        return None, None, None
    return smallest_diff_item


def transform_coordinates(coordinates, inputCoordinateSystem, outputCoordinateSystem):
    transformer = Transformer.from_crs(inputCoordinateSystem, outputCoordinateSystem)
    lat, lon = transformer.transform(coordinates[0], coordinates[1])
    return lat, lon


def get_excel_data(file, text, x, y, inputCoordinateSystem, outputCoordinateSystem):
    data = pd.read_excel(file)
    return list(zip(data.head(20)[text],
                    data.head(20)[[x, y]].apply(
                        lambda row: transform_coordinates(row, inputCoordinateSystem, outputCoordinateSystem),
                        axis=1)))


def extract_epsg(coordinate_system):
    start = coordinate_system.find("(") + 1
    end = coordinate_system.find(")")
    return coordinate_system[start:end].lower()


def calculate_distance(coord, lat_diff, lon_diff):
    geod = Geod(ellps="WGS84")

    original_lat, original_lon = coord

    new_lat = original_lat + lat_diff
    new_lon = original_lon + lon_diff

    angle1, angle2, distance = geod.inv(original_lon, original_lat, new_lon, new_lat)

    return distance


@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response


@app.route('/geoparse', methods=['POST'])
def geoparse():
    data = request.get_json()
    text = data.get('text')
    if not text:
        return jsonify({'error': 'No text provided'}), 400

    try:
        results = geo.geoparse(text)
        new_results = parse_float(results)
        return jsonify(new_results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/upload_excel', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return 'No file part', 400
    file = request.files['file']
    text = request.form.get('text')
    x = request.form.get('x')
    y = request.form.get('y')
    inputCoordinateSystem = extract_epsg(request.form.get('inputCoordinateSystem'))
    outputCoordinateSystem = extract_epsg(request.form.get('outputCoordinateSystem'))
    if file.filename == '':
        return 'No selected file', 400

    data = []
    i = 0
    dataExcel = pd.read_excel(file)
    new_data = []
    try:
        for i, row in dataExcel.iterrows():
            entry = row[text], (row[x], row[y])
            entry = entry[0], transform_coordinates(entry[1], inputCoordinateSystem, wgs)
            geoparsed_text = parse_float(geo.geoparse(entry[0]))
            geoparsed, diff_lat, diff_lon = calculate_difference(entry[1], geoparsed_text)
            distance = 'N/A'
            success = 'N/A'
            if diff_lat is None or diff_lon is None:
                rating = 0
                success = 'No'
            else:
                distance = round(calculate_distance(entry[1], diff_lat, diff_lon), 2)
                avg = (diff_lat + diff_lon) / 2
                if avg < 0.55:
                    rating = 1
                    success = 'Yes'
                else:
                    rating = 2
                    success = 'No'

            difference = (diff_lat, diff_lon)

            if outputCoordinateSystem != wgs:
                entry = entry[0], transform_coordinates(entry[1], wgs, outputCoordinateSystem)
                if geoparsed is not None:
                    coords = transform_coordinates((geoparsed['geo']['lat'], geoparsed['geo']['lon']), wgs,
                                                   outputCoordinateSystem)
                    geoparsed['geo']['lat'] = coords[0]
                    geoparsed['geo']['lon'] = coords[1]
                    difference = transform_coordinates(difference, wgs, outputCoordinateSystem)

            data.append({
                "requested": entry,
                "geoparsed": geoparsed,
                "difference": difference,
                "distance": distance,
                "rating": rating
            })

            if geoparsed is not None:
                place_name = geoparsed['geo']['place_name']
                country = geoparsed['geo']['country_code3']
                region = geoparsed['geo']['admin1']
                lat = geoparsed['geo']['lat']
                lon = geoparsed['geo']['lon']
            else:
                place_name = 'N/A'
                country = 'N/A'
                region = 'N/A'
                lat = 'N/A'
                lon = 'N/A'

            new_data.append((entry[1][0], entry[1][1], place_name, country, region, lat, lon, distance, success))

        xs, ys, place_names, countrys, regions, lats, lons, distances, successs = zip(*new_data)

        dataExcel[x] = xs
        dataExcel[y] = ys
        dataExcel['place name'] = place_names
        dataExcel['country'] = countrys
        dataExcel['region'] = regions
        dataExcel['lat'] = lats
        dataExcel['lon'] = lons
        dataExcel['distance'] = distances
        dataExcel['success'] = successs

        excel_json = dataExcel.to_json(orient='records')

        return jsonify({'data': data, 'excel_data': excel_json})
    except Exception as e:
        print(str(e))
        return jsonify({'error': str(e)}), 500


@app.route('/es_search', methods=['POST'])
def es_search():
    data = request.get_json()
    query = data.get('query')
    es = Elasticsearch([{'host': 'localhost', 'port': 9200}])
    search_request = {
        "query": {
            "bool": {
                "must": [
                    {"wildcard": {"name": query + "*"}},
                    {"match": {"country_code3": "HRV"}}
                ]
            }
        }
    }

    try:
        response = es.search(index="geonames", body=search_request)
        return jsonify(response['hits']['hits'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
