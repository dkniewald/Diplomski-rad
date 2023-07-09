from elasticsearch import Elasticsearch, helpers
import sys
from datetime import datetime
import time
from pyproj import Transformer
import json
from tqdm import tqdm

es = Elasticsearch(urls='http://localhost:9200/', timeout=60, max_retries=2)

wgs = 'epsg:4326'
htrs = 'epsg:3765'


def getid(id):
    post_zero_str = id[id.find('0') + 1:]
    final_str = post_zero_str.lstrip('0')
    return final_str


def transform_coordinates(coordinates, inputCoordinateSystem, outputCoordinateSystem):
    transformer = Transformer.from_crs(inputCoordinateSystem, outputCoordinateSystem)
    lat, lon = transformer.transform(coordinates[0], coordinates[1])
    return lat, lon


def documents(dataJson):
    todays_date = datetime.today().strftime("%Y-%m-%d")
    count = 0

    for feature in tqdm(dataJson['features'], total=140000):
        id = getid(feature['properties']['identifika'])
        lat, lon = transform_coordinates((feature['properties']['X'], feature['properties']['Y']), htrs, wgs)
        coords = str(lat) + "," + str(lon)
        try:
            doc = {"geonameid": id,
                   "name": feature['properties']['geografsko'],
                   "asciiname": 'NA',
                   "alternativenames": 'NA',
                   "coordinates": coords,  # 4, 5
                   "feature_class": feature['properties']['vrstaobilj'],
                   "feature_code": 'NA',
                   "country_code2": 'NA',
                   "country_code3": 'HRV',
                   "admin1_code": r'NA',
                   "admin1_name": 'NA',
                   "admin2_code": 'NA',
                   "admin2_name": 'NA',
                   "admin3_code": 'NA',
                   "admin4_code": 'NA',
                   "population": 1,
                   "alt_name_length": 1,
                   "modification_date": todays_date
                   }
            action = {"_index": "geonames",
                      "_id": doc['geonameid'],
                      "_source": doc}
            yield action
        except Exception as e:
            print(e, row)
            count += 1
    print('Exception count:', count)


if __name__ == "__main__":
    t = time.time()
    with open('RH_toponimi.geojson', 'r', encoding='utf8') as json_file:
        data = json.load(json_file)
    actions = documents(data)
    helpers.bulk(es, actions, chunk_size=500)
    es.indices.refresh(index='geonames')
    e = (time.time() - t) / 60
    print("Elapsed minutes: ", e)
