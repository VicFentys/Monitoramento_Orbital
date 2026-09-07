from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, date
from typing import List, Optional

# --- SCHEMAS DE CATEGORIA ---

class CategoriaBase(BaseModel):
    id: int
    nome: str
    descricao: Optional[str] = None
    cor_visualizacao: str = Field(..., max_length=7, description="Cor em formato hexadecimal, ex: #FF0000")

    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE HISTÓRICO DE TLE ---

class TLEHistoricoBase(BaseModel):
    id: int
    epoch: datetime
    linha1: str = Field(..., min_length=69, max_length=69)
    linha2: str = Field(..., min_length=69, max_length=69)
    data_captura: datetime

    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE OBJETO ORBITAL ---

class ObjetoOrbitalBase(BaseModel):
    id: int
    nome: str
    norad_id: str
    pais: str
    status: str
    data_lancamento: Optional[date] = None
    categoria_id: int

    model_config = ConfigDict(from_attributes=True)


class ObjetoOrbitalResponse(ObjetoOrbitalBase):
    categoria: CategoriaBase
    ultimo_tle: Optional[TLEHistoricoBase] = None

    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE ESTATÍSTICAS ---

class EstatisticasPais(BaseModel):
    pais: str
    total: int
    ativos: Optional[int] = 0
    inativos: Optional[int] = 0
    detritos: Optional[int] = 0
    estacoes: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class EvolucaoHistorica(BaseModel):
    data: str = Field(..., description="Data no formato YYYY-MM-DD")
    total: int

    model_config = ConfigDict(from_attributes=True)


class EstatisticasResponse(BaseModel):
    total_objetos: int
    percentual_detritos: float
    distribuicao_paises: List[EstatisticasPais]
    evolucao_historica: List[EvolucaoHistorica]

    model_config = ConfigDict(from_attributes=True)
